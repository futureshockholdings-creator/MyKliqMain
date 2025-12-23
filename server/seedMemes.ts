import { db } from "./db";
import { memes } from "@shared/schema";
import { sql } from "drizzle-orm";

const memesList = [
  { id: "865576ed-101c-4b15-ad56-cf9c161b3e97", title: "Happy Birthday", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/e8f81aee-6ea4-4572-9e70-1d43096cb7c9", description: "", category: "general", isAnimated: false },
  { id: "353cf173-0d27-4dd9-a1b6-15889283275e", title: "Happy Birthday1", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/bdb4aa2b-a68d-45d5-af69-475c1095dad1", description: "", category: "general", isAnimated: false },
  { id: "a366f2d5-3806-4305-9fa4-5a89e7b36092", title: "Happy Birthday2", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/e1f148c1-75db-4c66-8469-3d0e6d9acd5f", description: "", category: "general", isAnimated: false },
  { id: "432258c8-c84d-4b00-8267-7e0a13f3a935", title: "Happy Birthday4", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/7a007c4b-745b-41e5-a5f3-689dbf834323", description: "", category: "general", isAnimated: false },
  { id: "a2b8c7a3-f836-49e7-8513-353f1ddb5314", title: "Happy Birthday3", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/bafe5460-dab1-4eb6-bee0-55f5d06bd5a5", description: "", category: "general", isAnimated: false },
  { id: "1dca5e80-9ef3-423a-9183-6decb0807460", title: "Happy Birthday5", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/a827440b-1df7-4fe4-b544-f722746e7a64", description: "", category: "general", isAnimated: false },
  { id: "b6864711-1dd2-4235-ac94-d568358f21cc", title: "Happy Birthday8", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/4f16e196-9cce-4784-96a7-1ddad37fc97d", description: "", category: "general", isAnimated: false },
  { id: "17e6f8c7-0d26-41bd-bdc3-13e17db1f7db", title: "Happy Birthday6", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/5a5a610c-80d8-462d-9e3e-cb01d90bbf1c", description: "", category: "general", isAnimated: false },
  { id: "4984f390-e4e4-488a-8247-55a39d033c2e", title: "Happy Birthday7", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/0e7bc848-144f-4344-89e0-09398a6d358e", description: "", category: "general", isAnimated: false },
  { id: "f726dfb8-a5f5-486a-829e-e445521f7f72", title: "Happy Birthday9", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/b8d1c04b-73a9-46c8-b9f3-edac19b3dba8", description: "", category: "general", isAnimated: false },
  { id: "a6cb9f40-6174-464d-ac80-0f9979865e36", title: "Happy Birthday10", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/ea92885a-6201-45f0-a21f-e5e24018a7f4", description: "", category: "general", isAnimated: false },
  { id: "d904c258-4be4-4680-bd5b-3aba7c71c151", title: "Happy Birthday11", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/77399097-bbb1-42d7-9861-998e7608f1d7", description: "", category: "general", isAnimated: false },
  { id: "43582f09-ad62-44ac-8cfc-b909f88d1b8d", title: "Happy Birthday12", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/b22d4daf-b091-48e6-bbc9-0c00dc42bbcb", description: "", category: "general", isAnimated: false },
  { id: "90fbbbbe-e2fb-49c8-ae66-918ae067f78e", title: "Happy Birthday14", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/62bd81f5-2614-4c0f-8caa-7abf3d0930ea", description: "", category: "general", isAnimated: false },
  { id: "7c45e3a6-5721-42c6-a584-517611023ef4", title: "Happy Birthday15", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/28eea56f-205e-46be-9282-2f47c1c29667", description: "", category: "general", isAnimated: false },
  { id: "4e9f2393-174b-4c87-9294-c24adaf3f504", title: "Happy Birthday13", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/377bbb69-475e-4828-9b93-a77d63f7b57d", description: "", category: "general", isAnimated: false },
  { id: "a53be3a4-cee1-442e-8d60-a7bfb7ec2a5c", title: "Happy Birthday16", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/7a1cfa10-4aa7-479a-adad-9a91d9060230", description: "", category: "general", isAnimated: false },
  { id: "d288761c-a3bc-44d0-83a8-ddbc72d0b67e", title: "Happy Birthday17", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/f006f0ae-404b-4ea4-a1ea-7aa6030510bd", description: "", category: "general", isAnimated: false },
  { id: "e127d36d-1c16-4636-b9af-6544c359100d", title: "Happy Birthday18", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/c5845d40-ea18-418e-8a0f-32f5364e0b39", description: "", category: "general", isAnimated: false },
  { id: "58cf660d-2f0f-4a0d-8514-11d16703b6eb", title: "Happy Birthday19", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/48a516b5-476c-4040-8ac8-6eabd7b39a1d", description: "", category: "general", isAnimated: false },
  { id: "caf7a3cd-19e6-48be-aa96-510fbfc55f1f", title: "Happy Birthday21", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/9dbc974d-e596-47a7-ab6e-42515197e58b", description: "", category: "general", isAnimated: false },
  { id: "051452b3-5538-4346-bf73-67df18e2f2bd", title: "Happy Birthday20", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/c2496cb3-f1c5-44fd-9e73-9c9e8bf6250f", description: "", category: "general", isAnimated: false },
  { id: "edff47f5-0d05-4e14-8a2a-2dcc5eecf813", title: "Happy Birthday22", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/9735ccb8-98ba-407c-874b-b86d9121e0fb", description: "", category: "general", isAnimated: false },
  { id: "7b490d3a-f934-4d45-bd9d-011554d10f11", title: "Happy Birthday23", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/7cc5c878-e33c-4720-9520-5ae292690b23", description: "", category: "general", isAnimated: false },
  { id: "8c876e2c-6389-43c9-be30-43e6b9abb0f6", title: "Happy Birthday24", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/301f1135-cbe5-45ea-818a-b46216a20efc", description: "", category: "general", isAnimated: false },
  { id: "5d8a4ec2-3c45-4336-b4ea-25b6a0b17f77", title: "Happy Birthday25", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/6c4c369e-cad5-448d-8395-a39dc0796f58", description: "", category: "general", isAnimated: false },
  { id: "9e5b6923-7362-4ca2-85c4-9afb05a80167", title: "Happy Birthday27", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/d22ae8f3-1c72-4762-8510-a87cf0648b7f", description: "", category: "general", isAnimated: false },
  { id: "be51a9b9-4775-4fc4-b32d-54a3e6a7699f", title: "Happy Birthday28", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/64161640-50d0-42f0-a6b4-645622345a23", description: "", category: "general", isAnimated: false },
  { id: "49506ebc-f2ab-4892-b119-9a468e9015df", title: "Happy Birthday29", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/fad44160-d656-4b20-97e7-a12540237113", description: "", category: "general", isAnimated: false },
  { id: "41a4a5ea-e110-4ca0-8fbf-1b84befe4369", title: "Happy Birthday26", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/e38e3c9f-66a6-4814-b05d-c36312edf810", description: "", category: "general", isAnimated: false },
  { id: "c9fc7397-2f95-4761-9c5c-a6ed11bc8c1a", title: "Happy Birthday30", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/2a3ee69a-7782-4652-9d39-003d1dac6698", description: "", category: "general", isAnimated: false },
  { id: "5de43aaf-0e38-4bb7-b39a-d6c857c3618b", title: "Happy Birthday31", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/24afdd3b-e712-444f-abf4-cad323d973bc", description: "", category: "general", isAnimated: false },
  { id: "6c9d27e4-eb3b-4220-b9d7-02d7601daaed", title: "Happy Birthday32", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/888a98f9-88c5-4049-825b-eed2d7797a9b", description: "", category: "general", isAnimated: false },
  { id: "25d1fa6a-49c7-441b-b81d-57eb5a400f5e", title: "Happy Birthday33", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/470afbd6-576c-42f7-b519-4242a2dba12a", description: "", category: "general", isAnimated: false },
  { id: "4d569340-6ff9-4502-ac54-8c7b0ab8743f", title: "Happy Birthday35", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/81d9fa18-606b-4faf-bdc5-ad44eee15df5", description: "", category: "general", isAnimated: false },
  { id: "17c4d9de-7851-4301-b047-6c800c324abe", title: "Happy Birthday34", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/6441e4e2-9944-4c0b-8666-a12af3eb3a09", description: "", category: "general", isAnimated: false },
  { id: "bebbf17e-c7b8-49b1-a5cf-6db1815bdb4e", title: "Happy Birthday36", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/638e9bfd-4d7d-4b61-97f6-44214ea48bc8", description: "", category: "general", isAnimated: false },
  { id: "b0f0cedc-f380-4aa9-bb9c-482381f44c44", title: "Happy Birthday37", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/de150696-d5ee-4a44-8dc8-b91842e7f6d6", description: "", category: "general", isAnimated: false },
  { id: "cffb03c9-75df-4e9d-a313-6ea4dd7c763e", title: "Happy Birthday38", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/238d5716-d398-4d13-b90b-9e479c30996f", description: "", category: "general", isAnimated: false },
  { id: "9ee27d6d-7d28-4441-9768-85029c46fabc", title: "Happy Birthday39", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/4b0257ee-6ba4-4ec6-9093-2a213b3e96de", description: "", category: "general", isAnimated: false },
  { id: "25998061-1b21-48b8-acf6-05984f207669", title: "Happy Birthday40", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/f75ceb2a-6c33-49da-ba59-2714dfed3b67", description: "", category: "general", isAnimated: false },
  { id: "cdae7217-3fac-4664-aec5-472a02620570", title: "Happy Birthday41", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/bd1ecc3e-097b-40df-829a-bce94abb124b", description: "", category: "general", isAnimated: false },
  { id: "198768a9-cc79-44c7-8e79-2686b02dd18a", title: "Happy Birthday42", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/beb10885-31a4-4bee-8b57-840964eda6f6", description: "", category: "general", isAnimated: false },
  { id: "3b752af9-8c7d-4b63-a16e-dc641247a98d", title: "Happy Birthday45", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/49bcaa2f-da64-4366-9589-cd112a54d01e", description: "", category: "general", isAnimated: false },
  { id: "a0335b2e-a93c-4b77-85f1-05a18d876819", title: "Happy Birthday44", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/8fc8c5da-a407-404b-9096-f286cb7809d8", description: "", category: "general", isAnimated: false },
  { id: "a75be1d4-283e-4149-b9f2-a36267e1b351", title: "Happy Birthday43", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/03c586a9-0e83-4414-9d36-02d672e563d8", description: "", category: "general", isAnimated: false },
  { id: "b141b517-c8a5-49a6-a54f-05c50617740d", title: "Happy Birthday46", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/359878fa-31b3-4779-81fc-4aabf9477281", description: "", category: "general", isAnimated: false },
  { id: "6403fd3a-9d72-4e4a-8ba3-61082fd7bcc5", title: "Happy Birthday49", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/93a1de38-75a7-4540-8bc5-615ffadc3736", description: "", category: "general", isAnimated: false },
  { id: "83aa0bc6-f085-46ef-9acb-7170a11e6b95", title: "Happy Birthday47", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/45c53917-25fb-4b0f-992d-ef0bffdae675", description: "", category: "general", isAnimated: false },
  { id: "29fbf276-4d15-4873-a745-6a05620a05e3", title: "Happy Birthday50", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/bd6c5350-f580-4d38-96af-a3f0d89143f4", description: "", category: "general", isAnimated: false },
  { id: "8771184a-bc75-453b-8842-ee928e740f70", title: "Happy Birthday48", imageUrl: "https://storage.googleapis.com/replit-objstore-09955302-f21c-40f6-a989-f7dd7cc0f0bb/.private/uploads/62d78caf-518a-4b3d-9a72-170371b8f8d2", description: "", category: "general", isAnimated: false },
  { id: "17c51cf8-6c07-42b4-b07e-f4af6f84b65f", title: "Unpopular but Funny", imageUrl: "/public-objects/memes/36b1f44a-1d37-4be1-9209-c8a1e70172d0", description: "", category: "general", isAnimated: false },
  { id: "6b82ca0c-bd35-4ce0-ae6b-6d0a80b34309", title: "Before coffee, after coffee", imageUrl: "/public-objects/memes/eb22d62a-571f-4fbd-b1bb-8ae2720918c5", description: "", category: "general", isAnimated: false },
  { id: "37ffed3b-6622-4fb9-8277-d0becabf0166", title: "Do you know what sound cocaine makes", imageUrl: "/public-objects/memes/d2257367-4bdd-47af-962c-eff15a398e14", description: "", category: "general", isAnimated: false },
  { id: "c2339998-7b55-4e8a-8fe4-336b243dca67", title: "Everybody love everybody", imageUrl: "/public-objects/memes/93a388f6-310b-4ad1-b94e-9bca6b2a93de", description: "", category: "general", isAnimated: false },
  { id: "0fca3dce-6735-4f3d-84f1-d031dd32f9be", title: "Better than everyone else", imageUrl: "/public-objects/memes/88873c23-9683-4a64-ab8e-958f5392cf6b", description: "", category: "general", isAnimated: false },
  { id: "0a7e88c7-0a82-46b1-86b4-1f8d1e350a8c", title: "Fat, but I like pizza", imageUrl: "/public-objects/memes/8ea94dfa-ab78-49c6-8fad-f8cc13d28ab8", description: "", category: "general", isAnimated: false },
  { id: "b4d47e57-6602-410f-a001-7f5a6d5a74ea", title: "Everyone was thinking it", imageUrl: "/public-objects/memes/3e9fb87d-768d-41fb-803b-376273d2067d", description: "", category: "general", isAnimated: false },
  { id: "8707e67a-c4f8-444c-a767-61b797c515c2", title: "Fuck it", imageUrl: "/public-objects/memes/6fc60100-a9d3-4de9-b28e-44a4ee659392", description: "", category: "general", isAnimated: false },
  { id: "cbbdf17a-e539-413b-8f79-02477b20b372", title: "Happy Anniverary", imageUrl: "/public-objects/memes/db68f692-caf7-4119-bb8d-a9ed37ac4f37", description: "", category: "general", isAnimated: false },
  { id: "2e42ca94-7e16-4300-86a4-f6a93b604284", title: "Happy Anniversary1", imageUrl: "/public-objects/memes/decb5d07-20f3-4fe0-8f93-afa1361eec73", description: "", category: "general", isAnimated: false },
  { id: "88abba29-a479-4786-a7b2-f167121da97a", title: "Happy Anniversary2", imageUrl: "/public-objects/memes/f17b9a97-0625-456a-a3b4-1a206d8d5426", description: "", category: "general", isAnimated: false },
  { id: "8629510d-7eff-4f63-bb46-c485c39de187", title: "Happy Anniversary3", imageUrl: "/public-objects/memes/2015c0a2-0ab7-4564-b6b5-20b5bfc60a07", description: "", category: "general", isAnimated: false },
  { id: "4f655202-4b0a-4f3a-b4d8-5371ef6dee59", title: "Happy Anniversary4", imageUrl: "/public-objects/memes/0963b29f-f877-4a4b-a57e-e8983ec5c1b9", description: "", category: "general", isAnimated: false },
  { id: "ec056649-df44-4ffa-8775-8d6124058a5f", title: "Happy Anniversary5", imageUrl: "/public-objects/memes/7e996226-40c5-42c0-be7a-c85dfeafb5df", description: "", category: "general", isAnimated: false },
  { id: "7119436b-a504-43e0-97e5-886d802554ca", title: "Happy Anniversary6", imageUrl: "/public-objects/memes/7d67ae1b-f0ac-48cf-93c5-8f9d72820399", description: "", category: "general", isAnimated: false },
  { id: "ef4579f3-87b1-4d34-adc6-eb2d581d60d5", title: "Happy Anniversary7", imageUrl: "/public-objects/memes/6665fedc-8062-41e9-88f3-906660ee2e3b", description: "", category: "general", isAnimated: false },
  { id: "af3d008b-25dc-4a51-a77c-f047fe34b6f2", title: "Happy Anniversary8", imageUrl: "/public-objects/memes/e61bdbb1-aa0d-44e0-bb9a-f30d5935503a", description: "", category: "general", isAnimated: false },
  { id: "48864cf5-8901-4afd-aca7-fc82a227bfe4", title: "Happy Anniversary9", imageUrl: "/public-objects/memes/1faf8141-fb3b-4a34-8999-e52108848ff2", description: "", category: "general", isAnimated: false },
  { id: "ba2e973a-6f0f-4635-92aa-764b8484d3a2", title: "Happy Anniversary10", imageUrl: "/public-objects/memes/f5dc78c4-5a38-48b0-94f3-85a6eec16245", description: "", category: "general", isAnimated: false },
  { id: "4afd3509-e894-48eb-aff3-5927b3e9a269", title: "Happy Anniversary11", imageUrl: "/public-objects/memes/0b7cdab5-28c8-4bca-b9ee-12cf17244a63", description: "", category: "general", isAnimated: false },
  { id: "9ba29c96-23df-40fd-9ec1-2f5a9615efb4", title: "Happy Anniversary13", imageUrl: "/public-objects/memes/0cc99609-6b91-4132-8b8e-c86fff0a9290", description: "", category: "general", isAnimated: false },
  { id: "8ea81abb-b156-4333-af05-35d39a6b1ba2", title: "Happy Anniversary12", imageUrl: "/public-objects/memes/6320091b-3d22-4259-8302-3ac70e18dc28", description: "", category: "general", isAnimated: false },
  { id: "21dd4386-b2de-4114-93c8-404b2b5735c6", title: "I eat mud", imageUrl: "/public-objects/memes/b4df6427-91d4-449f-8969-57f43cbf89cd", description: "", category: "general", isAnimated: false },
  { id: "bf73e98c-c376-42f5-b80b-44f4f1ed7c7b", title: "Happy Marriage", imageUrl: "/public-objects/memes/5c3b8869-c305-443b-8fa4-bb1bb2cd7013", description: "", category: "general", isAnimated: false },
  { id: "6d19e94c-5e07-461d-98b5-86d1efa18b53", title: "I saw that", imageUrl: "/public-objects/memes/46c719bd-3933-4101-b3b4-b730500af902", description: "", category: "general", isAnimated: false },
  { id: "500991fb-fc1b-49e4-bbdb-1681e6a2e92a", title: "No trust of coworkers", imageUrl: "/public-objects/memes/ddec4a66-9d9a-494c-b7b7-dcf2290197e0", description: "", category: "general", isAnimated: false },
  { id: "c2e4811a-64dc-4fe3-9a5b-3ca8205c9881", title: "I will hear about this forever", imageUrl: "/public-objects/memes/b9817dc5-0bc8-4f7e-9c32-f5a9b10a56f5", description: "", category: "general", isAnimated: false },
  { id: "9a5dff29-60d6-47d2-bac8-c20735b54eaf", title: "Im not so sure", imageUrl: "/public-objects/memes/6d353e81-3923-4e83-af16-eca4e9d84497", description: "", category: "general", isAnimated: false },
  { id: "be866541-495a-4e88-a994-a43937434a73", title: "No, you cant talk to your wife", imageUrl: "/public-objects/memes/65724b9c-b86d-4c2b-bde2-7d0127bde893", description: "", category: "general", isAnimated: false },
  { id: "4b890d36-4a57-425e-8248-487ea3b43784", title: "Ric Flair", imageUrl: "/public-objects/memes/e5d9b228-b72e-431f-bdbe-b8305131982b", description: "", category: "general", isAnimated: false },
];

export async function seedMemes() {
  console.log('Seeding memes...');
  
  let insertedCount = 0;
  let skippedCount = 0;

  for (const meme of memesList) {
    try {
      const existing = await db
        .select({ id: memes.id })
        .from(memes)
        .where(sql`${memes.id} = ${meme.id}`)
        .limit(1);

      if (existing.length === 0) {
        await db.insert(memes).values({
          id: meme.id,
          title: meme.title,
          imageUrl: meme.imageUrl,
          description: meme.description,
          category: meme.category,
          isAnimated: meme.isAnimated,
          uploadedBy: null,
        });
        insertedCount++;
      } else {
        skippedCount++;
      }
    } catch (error) {
      console.error(`Failed to seed meme ${meme.title}:`, error);
    }
  }

  console.log(`✅ Memes seeding complete: ${insertedCount} inserted, ${skippedCount} already existed`);
  return { inserted: insertedCount, skipped: skippedCount };
}
