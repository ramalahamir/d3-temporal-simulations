import pandas as pd
import numpy as np

print("Starting merge process...")

# 1. Load the three separate files
try:
    gdp = pd.read_csv('gdp_pcap.csv')
    life = pd.read_csv('lex.csv')
    pop = pd.read_csv('pop.csv')
    print("Files loaded successfully.")
except FileNotFoundError as e:
    print(f"Error: {e}")
    exit(1)

# 2. "Melt" them to long format
# The first column is 'geo' (code) and second is 'name' (full name)
def melt_dataframe(df, value_name):
    # Keep both geo and name as identifiers
    id_vars = ['geo', 'name']
    return df.melt(id_vars=id_vars, var_name='year', value_name=value_name)

print("Reshaping data...")
gdp_long = melt_dataframe(gdp, 'gdpPercap')
life_long = melt_dataframe(life, 'lifeExp')
pop_long = melt_dataframe(pop, 'pop')

# 3. Clean and Prepare for Merge
# Convert year to integer for proper matching
def clean_year(df):
    # Coerce errors to NaN (in case of non-numeric columns) then drop them
    df['year'] = pd.to_numeric(df['year'], errors='coerce')
    return df.dropna(subset=['year'])

gdp_long = clean_year(gdp_long)
life_long = clean_year(life_long)
pop_long = clean_year(pop_long)

# 4. Merge them together
print("Merging datasets...")
# Outer join to keep as much data as possible, then we'll filter
merged = pd.merge(gdp_long, life_long, on=['geo', 'name', 'year'], how='inner')
final_df = pd.merge(merged, pop_long, on=['geo', 'name', 'year'], how='inner')

# Rename 'name' to 'country' and drop 'geo' to match expected format
final_df = final_df.rename(columns={'name': 'country'})
final_df = final_df.drop(columns=['geo'])

# 5. Data Cleaning
# Convert numeric columns to numbers, handling 'k', 'M', 'B' suffixes if they exist
# (Gapminder CSVs sometimes use suffixes like 10k, 5M)
def parse_number(x):
    if isinstance(x, str):
        x = x.lower().replace(',', '')
        if 'k' in x: return float(x.replace('k', '')) * 1000
        if 'm' in x: return float(x.replace('m', '')) * 1000000
        if 'b' in x: return float(x.replace('b', '')) * 1000000000
    return pd.to_numeric(x, errors='coerce')

print("Cleaning numeric values...")
final_df['gdpPercap'] = final_df['gdpPercap'].apply(parse_number)
final_df['lifeExp'] = final_df['lifeExp'].apply(parse_number)
final_df['pop'] = final_df['pop'].apply(parse_number)

# Drop rows with missing values in critical columns
final_df = final_df.dropna(subset=['gdpPercap', 'lifeExp', 'pop'])

# Add Continent (Optional but good for coloring)
# Country to continent mapping (copied from data_preparation.py to be self-contained)
continent_mapping = {
    "Afghanistan": "Asia",
    "Albania": "Europe",
    "Algeria": "Africa",
    "Angola": "Africa",
    "Argentina": "Americas",
    "Australia": "Oceania",
    "Austria": "Europe",
    "Bahrain": "Asia",
    "Bangladesh": "Asia",
    "Belgium": "Europe",
    "Benin": "Africa",
    "Bolivia": "Americas",
    "Bosnia and Herzegovina": "Europe",
    "Botswana": "Africa",
    "Brazil": "Americas",
    "Bulgaria": "Europe",
    "Burkina Faso": "Africa",
    "Burundi": "Africa",
    "Cambodia": "Asia",
    "Cameroon": "Africa",
    "Canada": "Americas",
    "Central African Republic": "Africa",
    "Chad": "Africa",
    "Chile": "Americas",
    "China": "Asia",
    "Colombia": "Americas",
    "Comoros": "Africa",
    "Congo, Dem. Rep.": "Africa",
    "Congo, Rep.": "Africa",
    "Costa Rica": "Americas",
    "Cote d'Ivoire": "Africa",
    "Croatia": "Europe",
    "Cuba": "Americas",
    "Czech Republic": "Europe",
    "Denmark": "Europe",
    "Djibouti": "Africa",
    "Dominican Republic": "Americas",
    "Ecuador": "Americas",
    "Egypt": "Africa",
    "El Salvador": "Americas",
    "Equatorial Guinea": "Africa",
    "Eritrea": "Africa",
    "Ethiopia": "Africa",
    "Finland": "Europe",
    "France": "Europe",
    "Gabon": "Africa",
    "Gambia": "Africa",
    "Germany": "Europe",
    "Ghana": "Africa",
    "Greece": "Europe",
    "Guatemala": "Americas",
    "Guinea": "Africa",
    "Guinea-Bissau": "Africa",
    "Haiti": "Americas",
    "Honduras": "Americas",
    "Hong Kong, China": "Asia",
    "Hungary": "Europe",
    "Iceland": "Europe",
    "India": "Asia",
    "Indonesia": "Asia",
    "Iran": "Asia",
    "Iraq": "Asia",
    "Ireland": "Europe",
    "Israel": "Asia",
    "Italy": "Europe",
    "Jamaica": "Americas",
    "Japan": "Asia",
    "Jordan": "Asia",
    "Kenya": "Africa",
    "Korea, Dem. Rep.": "Asia",
    "Korea, Rep.": "Asia",
    "Kuwait": "Asia",
    "Lebanon": "Asia",
    "Lesotho": "Africa",
    "Liberia": "Africa",
    "Libya": "Africa",
    "Madagascar": "Africa",
    "Malawi": "Africa",
    "Malaysia": "Asia",
    "Mali": "Africa",
    "Mauritania": "Africa",
    "Mauritius": "Africa",
    "Mexico": "Americas",
    "Mongolia": "Asia",
    "Montenegro": "Europe",
    "Morocco": "Africa",
    "Mozambique": "Africa",
    "Myanmar": "Asia",
    "Namibia": "Africa",
    "Nepal": "Asia",
    "Netherlands": "Europe",
    "New Zealand": "Oceania",
    "Nicaragua": "Americas",
    "Niger": "Africa",
    "Nigeria": "Africa",
    "Norway": "Europe",
    "Oman": "Asia",
    "Pakistan": "Asia",
    "Panama": "Americas",
    "Paraguay": "Americas",
    "Peru": "Americas",
    "Philippines": "Asia",
    "Poland": "Europe",
    "Portugal": "Europe",
    "Puerto Rico": "Americas",
    "Reunion": "Africa",
    "Romania": "Europe",
    "Rwanda": "Africa",
    "Sao Tome and Principe": "Africa",
    "Saudi Arabia": "Asia",
    "Senegal": "Africa",
    "Serbia": "Europe",
    "Sierra Leone": "Africa",
    "Singapore": "Asia",
    "Slovak Republic": "Europe",
    "Slovenia": "Europe",
    "Somalia": "Africa",
    "South Africa": "Africa",
    "Spain": "Europe",
    "Sri Lanka": "Asia",
    "Sudan": "Africa",
    "Swaziland": "Africa",
    "Sweden": "Europe",
    "Switzerland": "Europe",
    "Syria": "Asia",
    "Taiwan": "Asia",
    "Tanzania": "Africa",
    "Thailand": "Asia",
    "Togo": "Africa",
    "Trinidad and Tobago": "Americas",
    "Tunisia": "Africa",
    "Turkey": "Europe",
    "Uganda": "Africa",
    "United Kingdom": "Europe",
    "United States": "Americas",
    "Uruguay": "Americas",
    "Venezuela": "Americas",
    "Vietnam": "Asia",
    "West Bank and Gaza": "Asia",
    "Yemen, Rep.": "Asia",
    "Zambia": "Africa",
    "Zimbabwe": "Africa"
}

final_df['continent'] = final_df['country'].map(continent_mapping)
# Fill unknown continents with 'Other'
final_df['continent'] = final_df['continent'].fillna('Other')
print("Mapped continents using internal dictionary.")

# 6. Save
output_file = 'gapminder_combined.csv'
final_df.to_csv(output_file, index=False)
print(f"Done! Saved {len(final_df)} rows to {output_file}")

# Also save as JSON for the web app
final_df.to_json('gapminder.json', orient='records')
print("Also saved as gapminder.json")