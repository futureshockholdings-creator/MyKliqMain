import {
  ChannelType,
  Client,
  GatewayIntentBits,
  Partials,
  type Message,
  type PartialMessage,
} from 'discord.js';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from './db';
import { decryptFromStorage } from './cryptoService';
import {
  discordChannelPermissions,
  discordGuildInstallations,
  discordMemberPermissions,
  discordSharingAudit,
  externalPosts,
  socialCredentials,
} from '@shared/schema';

const API = 'https://discord.com/api/v10';
const ADMINISTRATOR = 1 << 3;
const MANAGE_GUILD = 1 << 5;
const discordMessageUrl = (guildId: string, channelId: string, messageId: string) =>
  `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;

async function botFetch(path: string): Promise<Response> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error('Discord message sharing is not configured');
  return fetch(`${API}${path}`, { headers: { Authorization: `Bot ${token}` } });
}

export function getDiscordBotInstallUrl(state: string): string {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId || !process.env.DISCORD_BOT_TOKEN) throw new Error('Discord message sharing is not configured');
  const params = new URLSearchParams({
    client_id: clientId,
    scope: 'bot applications.commands',
    permissions: '68608',
    response_type: 'code',
    redirect_uri: `${process.env.BASE_URL || ''}/api/discord/bot/callback`,
    state,
  });
  return `https://discord.com/oauth2/authorize?${params}`;
}

export async function exchangeBotInstallCode(code: string): Promise<{ guildId: string }> {
  const body = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID || '',
    client_secret: process.env.DISCORD_CLIENT_SECRET || '',
    grant_type: 'authorization_code',
    code,
    redirect_uri: `${process.env.BASE_URL || ''}/api/discord/bot/callback`,
  });
  const response = await fetch(`${API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) throw new Error(`Discord bot authorization failed (${response.status})`);
  const result = await response.json() as { guild?: { id?: string } };
  if (!result.guild?.id) throw new Error('Discord did not return the installed server');
  return { guildId: result.guild.id };
}

export async function getBotGuild(guildId: string): Promise<{ id: string; name: string }> {
  const response = await botFetch(`/guilds/${guildId}`);
  if (!response.ok) throw new Error('MyKliq bot cannot access this Discord server');
  return response.json() as Promise<{ id: string; name: string }>;
}

export async function getGuildTextChannels(guildId: string) {
  const response = await botFetch(`/guilds/${guildId}/channels`);
  if (!response.ok) throw new Error('Could not load Discord channels');
  const channels = await response.json() as Array<{ id: string; name: string; type: number; position: number }>;
  return channels
    .filter(channel => channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement)
    .sort((a, b) => a.position - b.position)
    .map(({ id, name }) => ({ id, name }));
}

export async function getUserGuilds(accessToken: string) {
  const response = await fetch(`${API}/users/@me/guilds`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error('Could not verify Discord server permissions');
  return response.json() as Promise<Array<{ id: string; name: string; permissions: string; owner?: boolean }>>;
}

export function canManageGuild(guild: { permissions: string; owner?: boolean }): boolean {
  const permissions = Number(guild.permissions || '0');
  return Boolean(guild.owner) || (permissions & ADMINISTRATOR) !== 0 || (permissions & MANAGE_GUILD) !== 0;
}

async function getMessageSharingPermission(message: {
  guildId: string | null;
  channelId: string;
  author: { id: string; bot: boolean };
}) {
  if (!message.guildId || message.author.bot) return null;
  const [permission] = await db.select({ credentialId: discordMemberPermissions.socialCredentialId })
    .from(discordMemberPermissions)
    .innerJoin(discordGuildInstallations, and(
      eq(discordGuildInstallations.guildId, discordMemberPermissions.guildId),
      eq(discordGuildInstallations.isActive, true),
    ))
    .innerJoin(discordChannelPermissions, and(
      eq(discordChannelPermissions.guildId, discordMemberPermissions.guildId),
      eq(discordChannelPermissions.channelId, message.channelId),
      eq(discordChannelPermissions.isEnabled, true),
    ))
    .where(and(
      eq(discordMemberPermissions.guildId, message.guildId),
      eq(discordMemberPermissions.discordUserId, message.author.id),
      eq(discordMemberPermissions.isEnabled, true),
    )).limit(1);
  if (!permission) return null;

  const [credential] = await db.select().from(socialCredentials)
    .where(and(eq(socialCredentials.id, permission.credentialId), eq(socialCredentials.isActive, true))).limit(1);
  return credential || null;
}

export async function importDiscordMessage(message: Message): Promise<boolean> {
  if (!message.inGuild() || !message.content.trim()) return false;
  const credential = await getMessageSharingPermission(message);
  if (!credential) return false;

  const [existing] = await db.select({ id: externalPosts.id }).from(externalPosts)
    .where(and(
      eq(externalPosts.socialCredentialId, credential.id),
      eq(externalPosts.platformPostId, `discord-message-${message.id}`),
    )).limit(1);
  if (existing) return false;
  const attachments = Array.from(message.attachments.values());
  await db.insert(externalPosts).values({
    socialCredentialId: credential.id,
    platform: 'discord',
    platformPostId: `discord-message-${message.id}`,
    platformUserId: message.author.id,
    platformUsername: message.author.username,
    content: message.content,
    mediaUrls: attachments.map(file => file.url),
    thumbnailUrl: attachments.find(file => file.contentType?.startsWith('image/'))?.url || null,
    postUrl: message.url,
    platformCreatedAt: message.createdAt,
  });
  return true;
}

export async function updateImportedDiscordMessage(message: Message): Promise<boolean> {
  if (!message.inGuild() || message.author.bot) return false;
  const [existing] = await db.select({
    id: externalPosts.id,
    actorUserId: socialCredentials.userId,
  }).from(externalPosts)
    .innerJoin(socialCredentials, eq(socialCredentials.id, externalPosts.socialCredentialId))
    .where(and(
      eq(externalPosts.platformPostId, `discord-message-${message.id}`),
      eq(externalPosts.platform, 'discord'),
      eq(externalPosts.platformUserId, message.author.id),
      eq(externalPosts.postUrl, discordMessageUrl(message.guildId, message.channelId, message.id)),
    )).limit(1);
  if (!existing) return false;

  const attachments = Array.from(message.attachments.values());
  const [updated] = await db.transaction(async tx => {
    const changed = await tx.update(externalPosts).set({
      platformUsername: message.author.username,
      content: message.content,
      mediaUrls: attachments.map(file => file.url),
      thumbnailUrl: attachments.find(file => file.contentType?.startsWith('image/'))?.url || null,
      postUrl: message.url,
    }).where(eq(externalPosts.id, existing.id)).returning({ id: externalPosts.id });
    if (!changed[0]) return changed;
    await tx.insert(discordSharingAudit).values({
      guildId: message.guildId,
      actorUserId: existing.actorUserId,
      action: 'message_updated',
      channelId: message.channelId,
      details: { messageId: message.id, externalPostId: changed[0].id },
    });
    return changed;
  });
  return Boolean(updated);
}

export async function deleteImportedDiscordMessage(message: Message | PartialMessage): Promise<boolean> {
  if (!message.guildId) return false;
  const [existing] = await db.select({
    id: externalPosts.id,
    actorUserId: socialCredentials.userId,
  }).from(externalPosts)
    .innerJoin(socialCredentials, eq(socialCredentials.id, externalPosts.socialCredentialId))
    .where(and(
      eq(externalPosts.platformPostId, `discord-message-${message.id}`),
      eq(externalPosts.platform, 'discord'),
      eq(externalPosts.postUrl, discordMessageUrl(message.guildId, message.channelId, message.id)),
    )).limit(1);
  if (!existing) return false;

  const [deleted] = await db.transaction(async tx => {
    const removed = await tx.delete(externalPosts)
      .where(eq(externalPosts.id, existing.id))
      .returning({ id: externalPosts.id });
    if (!removed[0]) return removed;
    await tx.insert(discordSharingAudit).values({
      guildId: message.guildId!,
      actorUserId: existing.actorUserId,
      action: 'message_deleted',
      channelId: message.channelId,
      details: { messageId: message.id, externalPostId: removed[0].id },
    });
    return removed;
  });
  return Boolean(deleted);
}

let client: Client | null = null;
export async function startDiscordBot(): Promise<void> {
  if (client || !process.env.DISCORD_BOT_TOKEN) {
    if (!process.env.DISCORD_BOT_TOKEN) console.log('[DiscordBot] Disabled: DISCORD_BOT_TOKEN is not configured');
    return;
  }
  client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    partials: [Partials.Channel, Partials.Message],
  });
  client.on('messageCreate', message => {
    void importDiscordMessage(message).catch(error => console.error('[DiscordBot] Message import failed:', error));
  });
  client.on('messageUpdate', (_oldMessage, newMessage) => {
    void (async () => {
      const message = newMessage.partial ? await newMessage.fetch() : newMessage;
      await updateImportedDiscordMessage(message);
    })().catch(error => console.error('[DiscordBot] Message update failed:', error));
  });
  client.on('messageDelete', message => {
    void deleteImportedDiscordMessage(message).catch(error => console.error('[DiscordBot] Message deletion failed:', error));
  });
  client.on('guildDelete', guild => {
    void db.update(discordGuildInstallations)
      .set({ isActive: false, revokedAt: new Date(), updatedAt: new Date() })
      .where(eq(discordGuildInstallations.guildId, guild.id));
  });
  await client.login(process.env.DISCORD_BOT_TOKEN);
  console.log(`[DiscordBot] Connected as ${client.user?.tag}`);
}

export async function listDiscordSharing(userId: string) {
  const credential = await db.query.socialCredentials.findFirst({
    where: and(eq(socialCredentials.userId, userId), eq(socialCredentials.platform, 'discord')),
  });
  if (!credential) return { configured: Boolean(process.env.DISCORD_BOT_TOKEN), linked: false, guilds: [], audit: [] };
  const memberGuilds = await getUserGuilds(decryptFromStorage(credential.encryptedAccessToken));
  const guildById = new Map(memberGuilds.map(guild => [guild.id, guild]));
  if (memberGuilds.length === 0) {
    return { configured: Boolean(process.env.DISCORD_BOT_TOKEN), linked: true, guilds: [], audit: [] };
  }
  const guilds = await db.select({
    guildId: discordGuildInstallations.guildId,
    guildName: discordGuildInstallations.guildName,
    isActive: discordGuildInstallations.isActive,
    memberEnabled: discordMemberPermissions.isEnabled,
  }).from(discordGuildInstallations)
    .leftJoin(discordMemberPermissions, and(
      eq(discordMemberPermissions.guildId, discordGuildInstallations.guildId),
      eq(discordMemberPermissions.userId, userId),
    ))
    .where(inArray(discordGuildInstallations.guildId, memberGuilds.map(guild => guild.id)));
  const installedGuildIds = guilds.map(guild => guild.guildId);
  const audit = await db.select().from(discordSharingAudit)
    .where(installedGuildIds.length > 0
      ? inArray(discordSharingAudit.guildId, installedGuildIds)
      : eq(discordSharingAudit.actorUserId, userId))
    .orderBy(desc(discordSharingAudit.createdAt)).limit(25);
  return {
    configured: Boolean(process.env.DISCORD_BOT_TOKEN),
    linked: true,
    guilds: guilds.map(guild => ({
      ...guild,
      canManage: canManageGuild(guildById.get(guild.guildId)!),
    })),
    audit,
  };
}