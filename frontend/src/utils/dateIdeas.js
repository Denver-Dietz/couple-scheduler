const JSON_FILES = [
  'dates_active_outdoors.json',
  'dates_adventurous_thrill.json',
  'dates_art_culture.json',
  'dates_cozy_athome.json',
  'dates_daytime_morning.json',
  'dates_foodie_culinary.json',
  'dates_low_budget.json',
  'dates_quirky_unconventional.json',
  'dates_romantic_luxury.json',
  'dates_seasonal_festive.json'
];

let cachedDateData = null;

export async function fetchDateIdeas() {
  if (cachedDateData) {
    return cachedDateData;
  }

  const themes = [];
  const allIdeas = [];

  for (const filename of JSON_FILES) {
    try {
      const response = await fetch(`/dates/${filename}`);
      if (!response.ok) continue;
      
      const data = await response.json();
      
      const themeData = {
        theme: data.theme,
        description: data.description,
        filename: filename
      };
      themes.push(themeData);
      
      for (const idea of data.ideas) {
        allIdeas.push({
          ...idea,
          theme: data.theme,
          filename: filename,
        });
      }
    } catch (e) {
      console.error("Failed to load date idea file:", filename, e);
    }
  }

  cachedDateData = { themes, ideas: allIdeas };
  return cachedDateData;
}
