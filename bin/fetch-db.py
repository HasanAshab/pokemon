import requests
import json

# URLs for PokeAPI
urls = {
    "moves": "https://pokeapi.co/api/v2/move",
    "pokemons": "https://pokeapi.co/api/v2/pokemon",
    "types": "https://pokeapi.co/api/v2/type",
}

# Dictionary to hold the fetched data
db_data = {}


def get_types(pokemon):
  return [
      type_name
      for ptype in pokemon["types"]
      ptype.type.name
  ]
  
def get_stat(pokemon, name):
  for stat in pokemon["stats"]:
      if stat["stat"]["name"] == name:
          return stat["base_stat"]
  return None

def get_stats(pokemon):
  return {
    stat.stat.name: stat.base_stats
    for stat in pokemon.stats
    stat
  }

def get_effects(move):
    effect_text = move["effect_entries"][0]["short_effect"].lower()
    possible_effects = [
        "burn",
        "paralyze",
        "freeze",
        "poison",
        "badly",
        "sleep",
        "confuse",
        "flinch",
    ]

    return [effect for effect in possible_effects if effect in effect_text]

def calculate_retreat(move):
    # Retreat tiers
    retreats = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6]

    # Move power ranges
    power = move["power"]

    # Map power to retreat cost
    # Assuming power ranges are proportional (e.g., 0-60 -> 0.5-3)
    thresholds = [20, 50, 70, 110, 130, 150, 170, 190, 210, 230, 250, 250]

    for i, threshold in enumerate(thresholds):
        if power <= threshold:
            return retreats[i]

    return retreats[-1]  # Maximum retreat for very high power moves

def serialize_type(data):
  type_effectiveness = {}
    # Define multipliers based on damage relations
  for relation, multiplier in [
      ("double_damage_to", 1.2),
      ("half_damage_to", 0.7),
      ("no_damage_to", 0.3),
  ]:
    for type_entry in data["damage_relations"][relation]:
        type_name = type_entry["name"]
        type_effectiveness[type_name] = multiplier
  return type_effectiveness

def serialize_move(data):
  return {
    "meta": data["meta"],
    "power": data["power"],
    "accuracy": data["accuracy"],
    "damage_class": data["damage_class"]["name"],
    "type": data["type"]["name"],
    "effect_chance": data["effect_chance"],
    "effect_names": get_effects(data),
    "retreat": calculate_retreat(data),
  }

def serialize_pokemon(data):
  return {
    "types": get_types(data),
    **get_stats(data)
  }

def fetch_types():
  types = {}
  response = requests.get(urls["types"] + "?limit=100000")
  response.raise_for_status()
  data = response.json()["results"]
  for ptype in data:
    response = requests.get(f"{urls["types"]}/{ptype.name}")
    response.raise_for_status()
    types[ptype.name] = serialize_type(response.json())

def fetch_moves():
  moves = {}
  response = requests.get(urls["moves"] + "?limit=100000")
  response.raise_for_status()
  data = response.json()["results"]
  for move in data:
    response = requests.get(f"{urls["moves"]}/{move.name}")
    response.raise_for_status()
    moves[move.name] = serialize_move(response.json())
  return moves

def fetch_pokemons():
  pokemons = {}
  response = requests.get(urls["pokemons"] + "?limit=100000")
  response.raise_for_status()
  data = response.json()["results"]
  for pokemon in data:
    response = requests.get(f"{urls["pokemons"]}/{pokemon.name}")
    response.raise_for_status()
    pokemons[pokemon.name] = serialize_pokemon(response.json())
  return pokemons

print("Fetching types...")
db_data["types"] = fetch_types()
print("Fetching moves...")
db_data["moves"] = fetch_moves()
print("Fetching pokemons...")
db_data["pokemons"] = fetch_pokemons()


# Save the data to db.json
with open("db.json", "w") as file:
    json.dump(db_data, file, indent=4)

print("Data has been successfully saved to db.json.")
