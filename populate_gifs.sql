INSERT INTO gifs (title, description, url, thumbnail_url, tags, category, width, height, trending, featured) VALUES
-- Existing GIFs
('Happy Dance', 'Person dancing with joy', 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif', 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/200.gif', ARRAY['happy', 'dance', 'celebration'], 'emotions', 480, 270, true, true),
('Thumbs Up', 'Classic thumbs up approval', 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif', 'https://media.giphy.com/media/111ebonMs90YLu/200.gif', ARRAY['thumbs', 'approval', 'good'], 'reactions', 500, 375, true, false),
('Laughing', 'Person laughing out loud', 'https://media.giphy.com/media/3o7aCRloybJlXpNjSU/giphy.gif', 'https://media.giphy.com/media/3o7aCRloybJlXpNjSU/200.gif', ARRAY['laugh', 'funny', 'humor'], 'emotions', 480, 360, false, true),
('Heart Eyes', 'Love and admiration expression', 'https://media.giphy.com/media/3o6Zt7g9nH1nFGeBcQ/giphy.gif', 'https://media.giphy.com/media/3o6Zt7g9nH1nFGeBcQ/200.gif', ARRAY['love', 'heart', 'admiration'], 'emotions', 480, 270, true, false),
('Clapping', 'Enthusiastic applause', 'https://media.giphy.com/media/7rj2ZgttvgomY/giphy.gif', 'https://media.giphy.com/media/7rj2ZgttvgomY/200.gif', ARRAY['clap', 'applause', 'congratulations'], 'reactions', 500, 281, false, false),
('Mind Blown', 'Head exploding with amazement', 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif', 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/200.gif', ARRAY['mind', 'blown', 'amazed'], 'reactions', 480, 270, true, true),
('Crying Laughing', 'Tears of joy from laughter', 'https://media.giphy.com/media/3o6UBlHJQT19wSgJQk/giphy.gif', 'https://media.giphy.com/media/3o6UBlHJQT19wSgJQk/200.gif', ARRAY['crying', 'laugh', 'tears'], 'emotions', 480, 270, false, false),
('Facepalm', 'Classic facepalm reaction', 'https://media.giphy.com/media/XsUtdIeJ0MWMo/giphy.gif', 'https://media.giphy.com/media/XsUtdIeJ0MWMo/200.gif', ARRAY['facepalm', 'disappointed', 'oops'], 'reactions', 500, 375, false, true),
('Waving Hello', 'Friendly greeting wave', 'https://media.giphy.com/media/3ornka9rAaKRA2Rkac/giphy.gif', 'https://media.giphy.com/media/3ornka9rAaKRA2Rkac/200.gif', ARRAY['wave', 'hello', 'greeting'], 'greetings', 480, 480, false, false),
('High Five', 'Celebratory high five', 'https://media.giphy.com/media/3o7qDEq2bMbcbPRQ2c/giphy.gif', 'https://media.giphy.com/media/3o7qDEq2bMbcbPRQ2c/200.gif', ARRAY['high', 'five', 'celebration'], 'reactions', 480, 270, true, false),
('Shocked', 'Surprised and shocked expression', 'https://media.giphy.com/media/3o6wreo4BgGBLgrKx2/giphy.gif', 'https://media.giphy.com/media/3o6wreo4BgGBLgrKx2/200.gif', ARRAY['shocked', 'surprised', 'wow'], 'emotions', 480, 270, false, false),
('Sleepy', 'Tired and sleepy feeling', 'https://media.giphy.com/media/3o7qE1YN7aBOFPRw8E/giphy.gif', 'https://media.giphy.com/media/3o7qE1YN7aBOFPRw8E/200.gif', ARRAY['sleepy', 'tired', 'yawn'], 'emotions', 480, 270, false, false),

-- Fun & Comedy
('Party Time', 'Epic party celebration', 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/200.gif', ARRAY['party', 'fun', 'celebrate'], 'fun', 480, 270, true, false),
('Funny Cat', 'Hilarious cat antics', 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif', 'https://media.giphy.com/media/JIX9t2j0ZTN9S/200.gif', ARRAY['cat', 'funny', 'animals'], 'fun', 400, 225, true, true),
('Dancing Dog', 'Dog dancing to music', 'https://media.giphy.com/media/l41lGvinEgARjB2HC/giphy.gif', 'https://media.giphy.com/media/l41lGvinEgARjB2HC/200.gif', ARRAY['dog', 'dance', 'fun'], 'fun', 480, 270, false, false),
('Confetti Celebration', 'Confetti explosion fun', 'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif', 'https://media.giphy.com/media/g9582DNuQppxC/200.gif', ARRAY['confetti', 'celebration', 'fun'], 'fun', 500, 281, false, true),
('Silly Dance', 'Goofy dance moves', 'https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif', 'https://media.giphy.com/media/5GoVLqeAOo6PK/200.gif', ARRAY['silly', 'dance', 'funny'], 'fun', 245, 300, true, false),

-- Disapproval & Negative Reactions
('Thumbs Down', 'Clear disapproval', 'https://media.giphy.com/media/iJxHzcuNcCJXi/giphy.gif', 'https://media.giphy.com/media/iJxHzcuNcCJXi/200.gif', ARRAY['thumbs', 'down', 'disapproval'], 'disapproval', 500, 375, false, false),
('Head Shake No', 'Shaking head in disagreement', 'https://media.giphy.com/media/1zSz5MVw4zKg0/giphy.gif', 'https://media.giphy.com/media/1zSz5MVw4zKg0/200.gif', ARRAY['no', 'disagree', 'head', 'shake'], 'disapproval', 245, 300, true, false),
('Eye Roll', 'Classic eye roll', 'https://media.giphy.com/media/Rhhr8D5mKSX7O/giphy.gif', 'https://media.giphy.com/media/Rhhr8D5mKSX7O/200.gif', ARRAY['eye', 'roll', 'annoyed'], 'disapproval', 500, 281, false, true),
('Disappointed', 'Visible disappointment', 'https://media.giphy.com/media/3oAt21Fnr4i54uK8vK/giphy.gif', 'https://media.giphy.com/media/3oAt21Fnr4i54uK8vK/200.gif', ARRAY['disappointed', 'sad', 'let', 'down'], 'disapproval', 480, 270, false, false),
('Not Amused', 'Clearly not impressed', 'https://media.giphy.com/media/1AIeYgwnqeBUxh6juu/giphy.gif', 'https://media.giphy.com/media/1AIeYgwnqeBUxh6juu/200.gif', ARRAY['not', 'amused', 'unimpressed'], 'disapproval', 480, 270, false, false),

-- Surprise & Shock
('Jaw Drop', 'Jaw dropping surprise', 'https://media.giphy.com/media/3o72F8t9TDi2xVnxOE/giphy.gif', 'https://media.giphy.com/media/3o72F8t9TDi2xVnxOE/200.gif', ARRAY['jaw', 'drop', 'surprise'], 'surprise', 480, 270, true, true),
('OMG Reaction', 'Oh my god reaction', 'https://media.giphy.com/media/xUOxeZUc8UFwMgH2MM/giphy.gif', 'https://media.giphy.com/media/xUOxeZUc8UFwMgH2MM/200.gif', ARRAY['omg', 'shock', 'surprise'], 'surprise', 480, 270, true, false),
('Eyes Wide', 'Wide-eyed surprise', 'https://media.giphy.com/media/l0MYC0LajbaPoEADu/giphy.gif', 'https://media.giphy.com/media/l0MYC0LajbaPoEADu/200.gif', ARRAY['eyes', 'wide', 'shocked'], 'surprise', 480, 270, false, false),
('Plot Twist', 'Unexpected plot twist', 'https://media.giphy.com/media/3oKIPf3C7HqqYBVcCk/giphy.gif', 'https://media.giphy.com/media/3oKIPf3C7HqqYBVcCk/200.gif', ARRAY['plot', 'twist', 'surprise'], 'surprise', 480, 270, false, true),
('Gasp', 'Dramatic gasp', 'https://media.giphy.com/media/l0MYGb8Q5IoAhR844/giphy.gif', 'https://media.giphy.com/media/l0MYGb8Q5IoAhR844/200.gif', ARRAY['gasp', 'shock', 'surprise'], 'surprise', 480, 270, false, false),

-- Yes & Agreement
('Nodding Yes', 'Enthusiastic yes nod', 'https://media.giphy.com/media/J336VCs1JC42zGRhjH/giphy.gif', 'https://media.giphy.com/media/J336VCs1JC42zGRhjH/200.gif', ARRAY['yes', 'nod', 'agree'], 'yes', 480, 270, true, false),
('Absolutely', 'Absolutely yes reaction', 'https://media.giphy.com/media/3o7absbD7PbTFQa0c8/giphy.gif', 'https://media.giphy.com/media/3o7absbD7PbTFQa0c8/200.gif', ARRAY['absolutely', 'yes', 'agree'], 'yes', 480, 270, false, true),
('Perfect', 'Perfect gesture', 'https://media.giphy.com/media/3ohfFhG5VDtDTzQv2o/giphy.gif', 'https://media.giphy.com/media/3ohfFhG5VDtDTzQv2o/200.gif', ARRAY['perfect', 'ok', 'good'], 'yes', 480, 270, false, false),
('Yep', 'Simple yep response', 'https://media.giphy.com/media/3oriO5t2QB4IPKgxHi/giphy.gif', 'https://media.giphy.com/media/3oriO5t2QB4IPKgxHi/200.gif', ARRAY['yep', 'yes', 'agree'], 'yes', 480, 270, false, false),

-- No & Disagreement
('Nope', 'Clear nope response', 'https://media.giphy.com/media/3o85xIO33l7RlmLR4I/giphy.gif', 'https://media.giphy.com/media/3o85xIO33l7RlmLR4I/200.gif', ARRAY['nope', 'no', 'disagree'], 'no', 480, 270, true, false),
('Hell No', 'Strong no reaction', 'https://media.giphy.com/media/3o7aCRloybJlXpNjSU/giphy.gif', 'https://media.giphy.com/media/3o7aCRloybJlXpNjSU/200.gif', ARRAY['hell', 'no', 'never'], 'no', 480, 270, false, true),
('Shaking Head', 'Disagreement head shake', 'https://media.giphy.com/media/3o6ZtaO9BZHcOjmErm/giphy.gif', 'https://media.giphy.com/media/3o6ZtaO9BZHcOjmErm/200.gif', ARRAY['no', 'head', 'shake'], 'no', 480, 270, false, false),
('Absolutely Not', 'Emphatic no', 'https://media.giphy.com/media/3oFzmkkwfOGlzZ0gxi/giphy.gif', 'https://media.giphy.com/media/3oFzmkkwfOGlzZ0gxi/200.gif', ARRAY['absolutely', 'not', 'no'], 'no', 480, 270, false, false),

-- Thank You & Gratitude
('Thank You', 'Grateful thank you', 'https://media.giphy.com/media/ZfK4cXKJTTay1Ava29/giphy.gif', 'https://media.giphy.com/media/ZfK4cXKJTTay1Ava29/200.gif', ARRAY['thank', 'you', 'grateful'], 'gratitude', 480, 270, true, true),
('Grateful', 'Deep gratitude expression', 'https://media.giphy.com/media/3oz8xIsloV7zOmt81G/giphy.gif', 'https://media.giphy.com/media/3oz8xIsloV7zOmt81G/200.gif', ARRAY['grateful', 'thanks', 'appreciate'], 'gratitude', 480, 270, false, false),
('Appreciate', 'Much appreciated', 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/200.gif', ARRAY['appreciate', 'thanks', 'gratitude'], 'gratitude', 480, 270, false, false),
('Bowing Thanks', 'Respectful bow of thanks', 'https://media.giphy.com/media/BPJmthQ3YRwD6QqcVD/giphy.gif', 'https://media.giphy.com/media/BPJmthQ3YRwD6QqcVD/200.gif', ARRAY['bow', 'thanks', 'respect'], 'gratitude', 480, 270, false, true),

-- Happy Birthday
('Birthday Cake', 'Birthday cake celebration', 'https://media.giphy.com/media/3o6fJ1BM7R2EBRDnxK/giphy.gif', 'https://media.giphy.com/media/3o6fJ1BM7R2EBRDnxK/200.gif', ARRAY['birthday', 'cake', 'celebration'], 'birthday', 480, 270, true, true),
('Birthday Party', 'Birthday party fun', 'https://media.giphy.com/media/l0MYGb8Q5IoAhR844/giphy.gif', 'https://media.giphy.com/media/l0MYGb8Q5IoAhR844/200.gif', ARRAY['birthday', 'party', 'celebrate'], 'birthday', 480, 270, true, false),
('Blowing Candles', 'Blowing out birthday candles', 'https://media.giphy.com/media/3o7qDMlVquZI1axqQ8/giphy.gif', 'https://media.giphy.com/media/3o7qDMlVquZI1axqQ8/200.gif', ARRAY['birthday', 'candles', 'wish'], 'birthday', 480, 270, false, true),
('Birthday Balloons', 'Colorful birthday balloons', 'https://media.giphy.com/media/KzDqC8LvVC4lshCcGK/giphy.gif', 'https://media.giphy.com/media/KzDqC8LvVC4lshCcGK/200.gif', ARRAY['birthday', 'balloons', 'party'], 'birthday', 480, 270, false, false),

-- Congratulations
('Congrats', 'Congratulations celebration', 'https://media.giphy.com/media/Is1O1TWV0LEJi/giphy.gif', 'https://media.giphy.com/media/Is1O1TWV0LEJi/200.gif', ARRAY['congrats', 'congratulations', 'celebrate'], 'congratulations', 500, 376, true, true),
('Well Done', 'Well done applause', 'https://media.giphy.com/media/3o6fJ1BM7R2EBRDnxK/giphy.gif', 'https://media.giphy.com/media/3o6fJ1BM7R2EBRDnxK/200.gif', ARRAY['well', 'done', 'good', 'job'], 'congratulations', 480, 270, false, false),
('Achievement', 'Achievement unlocked', 'https://media.giphy.com/media/xTiTnGeUsWOEwsGoG4/giphy.gif', 'https://media.giphy.com/media/xTiTnGeUsWOEwsGoG4/200.gif', ARRAY['achievement', 'success', 'win'], 'congratulations', 480, 270, false, true),
('Victory Dance', 'Victory celebration dance', 'https://media.giphy.com/media/kyLYXonQYYfwYDIeZl/giphy.gif', 'https://media.giphy.com/media/kyLYXonQYYfwYDIeZl/200.gif', ARRAY['victory', 'dance', 'win'], 'congratulations', 480, 270, true, false),

-- Happy Anniversary
('Anniversary Love', 'Anniversary celebration', 'https://media.giphy.com/media/l0Iy69UDt11YhqM5G/giphy.gif', 'https://media.giphy.com/media/l0Iy69UDt11YhqM5G/200.gif', ARRAY['anniversary', 'love', 'celebrate'], 'anniversary', 480, 270, true, true),
('Love Hearts', 'Floating love hearts', 'https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif', 'https://media.giphy.com/media/MDJ9IbxxvDUQM/200.gif', ARRAY['love', 'hearts', 'romance'], 'anniversary', 500, 375, false, false),
('Romantic', 'Romantic gesture', 'https://media.giphy.com/media/26uf759LlDftqZNVm/giphy.gif', 'https://media.giphy.com/media/26uf759LlDftqZNVm/200.gif', ARRAY['romantic', 'love', 'anniversary'], 'anniversary', 480, 270, false, true),
('Couple Goals', 'Relationship goals', 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif', 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/200.gif', ARRAY['couple', 'goals', 'love'], 'anniversary', 480, 270, false, false),

-- Christmas
('Christmas Tree', 'Decorated Christmas tree', 'https://media.giphy.com/media/d2YVk2ZRuQuqvVlu/giphy.gif', 'https://media.giphy.com/media/d2YVk2ZRuQuqvVlu/200.gif', ARRAY['christmas', 'tree', 'holiday'], 'christmas', 480, 270, true, true),
('Santa Claus', 'Jolly Santa Claus', 'https://media.giphy.com/media/ZXXri4W2Y0gLu/giphy.gif', 'https://media.giphy.com/media/ZXXri4W2Y0gLu/200.gif', ARRAY['santa', 'christmas', 'holiday'], 'christmas', 400, 300, true, false),
('Christmas Lights', 'Twinkling Christmas lights', 'https://media.giphy.com/media/3o6vXSgJ8Dcfkq48Ws/giphy.gif', 'https://media.giphy.com/media/3o6vXSgJ8Dcfkq48Ws/200.gif', ARRAY['christmas', 'lights', 'decorations'], 'christmas', 480, 270, false, true),
('Gift Opening', 'Opening Christmas presents', 'https://media.giphy.com/media/3o6ZtjCHd7dXSVb7Q4/giphy.gif', 'https://media.giphy.com/media/3o6ZtjCHd7dXSVb7Q4/200.gif', ARRAY['gifts', 'presents', 'christmas'], 'christmas', 480, 270, false, false),

-- Halloween
('Pumpkin', 'Spooky Halloween pumpkin', 'https://media.giphy.com/media/26uf1DvQc4q64hIdy/giphy.gif', 'https://media.giphy.com/media/26uf1DvQc4q64hIdy/200.gif', ARRAY['pumpkin', 'halloween', 'spooky'], 'halloween', 480, 270, true, true),
('Ghost', 'Cute ghost floating', 'https://media.giphy.com/media/d4aTwOdmHGGjGu1u/giphy.gif', 'https://media.giphy.com/media/d4aTwOdmHGGjGu1u/200.gif', ARRAY['ghost', 'halloween', 'spooky'], 'halloween', 480, 270, false, false),
('Witch', 'Halloween witch spell', 'https://media.giphy.com/media/3oKIPlLZEbEbacWqOc/giphy.gif', 'https://media.giphy.com/media/3oKIPlLZEbEbacWqOc/200.gif', ARRAY['witch', 'halloween', 'magic'], 'halloween', 480, 270, false, true),
('Trick or Treat', 'Halloween trick or treat', 'https://media.giphy.com/media/xTiTnBMEz7zAKs57LG/giphy.gif', 'https://media.giphy.com/media/xTiTnBMEz7zAKs57LG/200.gif', ARRAY['trick', 'treat', 'halloween'], 'halloween', 480, 270, true, false),

-- Thanksgiving
('Turkey', 'Thanksgiving turkey', 'https://media.giphy.com/media/3o6wrebnKWmvx4cVW0/giphy.gif', 'https://media.giphy.com/media/3o6wrebnKWmvx4cVW0/200.gif', ARRAY['turkey', 'thanksgiving', 'grateful'], 'thanksgiving', 480, 270, true, true),
('Grateful', 'Thanksgiving gratitude', 'https://media.giphy.com/media/3oKIPlMZX8KqxUuAyA/giphy.gif', 'https://media.giphy.com/media/3oKIPlMZX8KqxUuAyA/200.gif', ARRAY['grateful', 'thanksgiving', 'blessed'], 'thanksgiving', 480, 270, false, false),
('Feast', 'Thanksgiving feast', 'https://media.giphy.com/media/xUOrws9q4U0Z9wGJwI/giphy.gif', 'https://media.giphy.com/media/xUOrws9q4U0Z9wGJwI/200.gif', ARRAY['feast', 'thanksgiving', 'food'], 'thanksgiving', 480, 270, false, true),
('Family Time', 'Thanksgiving family gathering', 'https://media.giphy.com/media/l0K4mVE5b5WZ1CwE0/giphy.gif', 'https://media.giphy.com/media/l0K4mVE5b5WZ1CwE0/200.gif', ARRAY['family', 'thanksgiving', 'together'], 'thanksgiving', 480, 270, false, false),

-- New Year
('Fireworks', 'New Year fireworks', 'https://media.giphy.com/media/26ufnwz3wDUli7GU0/giphy.gif', 'https://media.giphy.com/media/26ufnwz3wDUli7GU0/200.gif', ARRAY['fireworks', 'new', 'year'], 'new-year', 480, 270, true, true),
('Countdown', 'New Year countdown', 'https://media.giphy.com/media/xT39D7O9Xj1JqKq5i0/giphy.gif', 'https://media.giphy.com/media/xT39D7O9Xj1JqKq5i0/200.gif', ARRAY['countdown', 'new', 'year'], 'new-year', 480, 270, false, false),
('Champagne', 'New Year champagne toast', 'https://media.giphy.com/media/g5R9dok94mrIY/giphy.gif', 'https://media.giphy.com/media/g5R9dok94mrIY/200.gif', ARRAY['champagne', 'toast', 'new', 'year'], 'new-year', 245, 300, false, true),
('Celebration', 'New Year celebration', 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/200.gif', ARRAY['celebration', 'new', 'year', 'party'], 'new-year', 480, 270, true, false),

-- Valentine's Day
('Valentine Hearts', 'Valentine''s Day hearts', 'https://media.giphy.com/media/3oEjHUXruNGjSfjWE8/giphy.gif', 'https://media.giphy.com/media/3oEjHUXruNGjSfjWE8/200.gif', ARRAY['valentine', 'hearts', 'love'], 'valentines', 480, 270, true, true),
('Cupid', 'Cupid with arrow', 'https://media.giphy.com/media/26uf1DvQc4q64hIdy/giphy.gif', 'https://media.giphy.com/media/26uf1DvQc4q64hIdy/200.gif', ARRAY['cupid', 'valentine', 'love'], 'valentines', 480, 270, false, false),
('Love Letter', 'Valentine love letter', 'https://media.giphy.com/media/ZOln4JxCoZay4/giphy.gif', 'https://media.giphy.com/media/ZOln4JxCoZay4/200.gif', ARRAY['love', 'letter', 'valentine'], 'valentines', 500, 375, false, true),
('Roses', 'Valentine roses', 'https://media.giphy.com/media/l0Iy69UDt11YhqM5G/giphy.gif', 'https://media.giphy.com/media/l0Iy69UDt11YhqM5G/200.gif', ARRAY['roses', 'valentine', 'romance'], 'valentines', 480, 270, false, false),

-- Easter
('Easter Bunny', 'Cute Easter bunny', 'https://media.giphy.com/media/l0K4n7E6bNNRz9Hq0/giphy.gif', 'https://media.giphy.com/media/l0K4n7E6bNNRz9Hq0/200.gif', ARRAY['easter', 'bunny', 'spring'], 'easter', 480, 270, true, true),
('Easter Eggs', 'Colorful Easter eggs', 'https://media.giphy.com/media/d2YFYI5ZHlOSl4Wa3Q/giphy.gif', 'https://media.giphy.com/media/d2YFYI5ZHlOSl4Wa3Q/200.gif', ARRAY['easter', 'eggs', 'colorful'], 'easter', 480, 270, false, false),
('Spring Flowers', 'Spring Easter flowers', 'https://media.giphy.com/media/l2RnuUNpJlLaKW0pO/giphy.gif', 'https://media.giphy.com/media/l2RnuUNpJlLaKW0pO/200.gif', ARRAY['spring', 'flowers', 'easter'], 'easter', 480, 270, false, true),
('Egg Hunt', 'Easter egg hunt', 'https://media.giphy.com/media/3o6ZtS2ACH3X7CCMW4/giphy.gif', 'https://media.giphy.com/media/3o6ZtS2ACH3X7CCMW4/200.gif', ARRAY['egg', 'hunt', 'easter'], 'easter', 480, 270, false, false),

-- Fourth of July
('Fireworks USA', 'Fourth of July fireworks', 'https://media.giphy.com/media/26ufnwz3wDUli7GU0/giphy.gif', 'https://media.giphy.com/media/26ufnwz3wDUli7GU0/200.gif', ARRAY['fireworks', 'fourth', 'july', 'usa'], 'fourth-july', 480, 270, true, true),
('American Flag', 'Waving American flag', 'https://media.giphy.com/media/xT5LMC40xY2fKKKi6I/giphy.gif', 'https://media.giphy.com/media/xT5LMC40xY2fKKKi6I/200.gif', ARRAY['flag', 'american', 'patriotic'], 'fourth-july', 480, 270, false, false),
('BBQ Time', 'Fourth of July BBQ', 'https://media.giphy.com/media/3oKIP73vEZmJjC9XH2/giphy.gif', 'https://media.giphy.com/media/3oKIP73vEZmJjC9XH2/200.gif', ARRAY['bbq', 'grill', 'fourth', 'july'], 'fourth-july', 480, 270, false, true),
('Patriotic', 'Patriotic celebration', 'https://media.giphy.com/media/xUOrwjhPR3NU5hOeEE/giphy.gif', 'https://media.giphy.com/media/xUOrwjhPR3NU5hOeEE/200.gif', ARRAY['patriotic', 'celebrate', 'america'], 'fourth-july', 480, 270, false, false);
