import aiohttp
import asyncio
import json
import os

# URLs for PokeAPI
urls = {
    "moves": "https://pokeapi.co/api/v2/move",
    "pokemons": "https://pokeapi.co/api/v2/pokemon",
    "types": "https://pokeapi.co/api/v2/type",
}

CONCURRENT_LIMIT = 30  # Limit for simultaneous requests

# Create directories for the database
os.makedirs("db/moves", exist_ok=True)
os.makedirs("db/pokemons", exist_ok=True)


def save_json(filepath, data):
    with open(filepath, "w") as file:
        json.dump(data, file, indent=4)


def get_types(pokemon):
    return [ptype["type"]["name"] for ptype in pokemon["types"]]


def get_stats(pokemon):
    return { 
        stat["stat"]["name"]: stat["base_stat"]
        for stat in pokemon["stats"] 
    }


def get_efforts(pokemon):
    return { 
        stat["stat"]["name"]: stat["effort"]
        for stat in pokemon["stats"] 
    }


def get_effects(move):
    if len(move["effect_entries"]) == 0:
        return []
    effect_text = move["effect_entries"][0]["short_effect"].lower()
    possible_effects = [
        "burn",
        "paralyze",
        "freeze",
        "poison",
        "badly",
        "sleep",
        "confuse",
    ]
    return [effect for effect in possible_effects if effect in effect_text]

def get_english_description(data):
    flavor_text_entries = data["flavor_text_entries"]
    for entry in flavor_text_entries:
        if entry["language"]["name"] == "en":
            return entry["flavor_text"].replace("\n", " ")
    return "No description..."


def calculate_retreat(move):
    damage_class_bonus = {
        "special": 0,
        "physical": 0,
        "status": -0.5,
    }
    retreats = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6]
    thresholds = [20, 50, 70, 110, 130, 150, 170, 190, 210, 230, 250, 250]
    power = move["power"]
    if power is None:
        retreat = retreats[2]
    else:
        for i, threshold in enumerate(thresholds):
            if power <= threshold:
                retreat = retreats[i]
                break
    return retreat + damage_class_bonus[move["damage_class"]["name"]]


def parse_stat_changes(data):
    stat_changes = {
        "self": {},
        "target": {},
    }
    for stat_change in data["stat_changes"]:
        key = "self" if stat_change["change"] > 0 else "target"
        stat_changes[key][stat_change["stat"]["name"]] = stat_change["change"]
    return stat_changes


def serialize_type(data):
    type_effectiveness = {}
    for relation, multiplier in [
        ("double_damage_to", 1.5),
        ("half_damage_to", 0.5),
        ("no_damage_to", 0.25),
    ]:
        for type_entry in data["damage_relations"][relation]:
            type_name = type_entry["name"]
            type_effectiveness[type_name] = multiplier
    return type_effectiveness


def serialize_move(data):
    pp = None if data["pp"] is None else round(data["pp"] / 3)

    return {
        "meta": data["meta"],
        "power": data["power"],
        "accuracy": data["accuracy"],
        "pp": pp,
        "description": get_english_description(data),
        "damage_class": data["damage_class"]["name"],
        "makes_contact": data["damage_class"]["name"] == "physical",
        "type": data["type"]["name"],
        "effect_chance": data.get("effect_chance"),
        "effect_names": get_effects(data),
        "retreat": calculate_retreat(data),
        "stat_changes": parse_stat_changes(data),
    }


def serialize_pokemon(data):
    return {
        "types": get_types(data),
        "stats": get_stats(data),
        "efforts": get_efforts(data),
    }


async def fetch_item(url, session, semaphore):
    async with semaphore:
        async with session.get(url) as response:
            response.raise_for_status()
            return await response.json()


async def fetch_types(session):
    print("Fetching types...")
    async with session.get(f"{urls['types']}?limit=100000") as response:
        response.raise_for_status()
        data = await response.json()

    semaphore = asyncio.Semaphore(CONCURRENT_LIMIT)
    tasks = [
        asyncio.create_task(fetch_item(ptype["url"], session, semaphore))
        for ptype in data["results"]
    ]

    types = {}
    for ptype, type_data in zip(data["results"], await asyncio.gather(*tasks)):
        types[ptype["name"]] = serialize_type(type_data)

    # Save types in a single JSON file
    save_json("db/types.json", types)
    print("Fetched and saved types!")
    return types


async def fetch_moves(session):
    print("Fetching moves...")
    async with session.get(f"{urls['moves']}?limit=100000") as response:
        response.raise_for_status()
        data = await response.json()

    semaphore = asyncio.Semaphore(CONCURRENT_LIMIT)
    tasks = [
        asyncio.create_task(fetch_item(move["url"], session, semaphore))
        for move in data["results"]
    ]

    move_names = []
    for move, move_data in zip(data["results"], await asyncio.gather(*tasks)):
        serialized_move = serialize_move(move_data)
        move_name = move["name"]
        move_names.append(move_name)
        save_json(f"db/moves/{move_name}.json", serialized_move)

    # Save all move names in __all__.json
    save_json("db/moves/__all__.json", move_names)
    print("Fetched and saved moves!")
    return move_names


async def fetch_pokemons(session):
    print("Fetching pokemons...")
    async with session.get(f"{urls['pokemons']}?limit=100000") as response:
        response.raise_for_status()
        data = await response.json()

    semaphore = asyncio.Semaphore(CONCURRENT_LIMIT)
    tasks = [
        asyncio.create_task(fetch_item(pokemon["url"], session, semaphore))
        for pokemon in data["results"]
    ]

    pokemon_names = []
    for pokemon, pokemon_data in zip(data["results"], await asyncio.gather(*tasks)):
        serialized_pokemon = serialize_pokemon(pokemon_data)
        pokemon_name = pokemon["name"]
        pokemon_names.append(pokemon_name)
        save_json(f"db/pokemons/{pokemon_name}.json", serialized_pokemon)

    # Save all pokemon names in __all__.json
    save_json("db/pokemons/__all__.json", pokemon_names)
    print("Fetched and saved pokemons!")
    return pokemon_names


async def main():
    async with aiohttp.ClientSession() as session:
        await fetch_types(session)
        await fetch_moves(session)
        await fetch_pokemons(session)
        print("All data fetched and saved successfully!")


# Run the main function
asyncio.run(main())
