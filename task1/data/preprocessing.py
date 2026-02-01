import pandas as pd

# Loading the raw data
df = pd.read_csv('global_power_plant_database.csv', low_memory=False)

# Keeping only the columns required
cols = ['country_long', 'name', 'capacity_mw', 'latitude', 'longitude', 'primary_fuel', 'commissioning_year']
df_clean = df[cols].copy()

# Removing rows where data is missing
df_clean = df_clean.dropna(subset=['commissioning_year', 'latitude', 'longitude', 'capacity_mw', 'primary_fuel'])

# Converting Year to Integer
df_clean['commissioning_year'] = df_clean['commissioning_year'].astype(int)

# Saving as JSON
df_clean.to_json('power_plants.json', orient='records')
print(f"Done! Saved {len(df_clean)} plants to power_plants.json")