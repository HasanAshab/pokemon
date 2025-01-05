import asyncio
import aiohttp
import json
import os

async def fetch_pokemon_data(session, url):
    async with session.get(url) as response:
        return await response.json()

async def fetch_learnsets():
    base_url = "https://pokeapi.co/api/v2"
    pokemon_url = f"{base_url}/pokemon?limit=10000"  # Fetch all Pokémon
    output_dir = "data/learnsets"

    # Ensure the output directory exists
    os.makedirs(output_dir, exist_ok=True)

    async with aiohttp.ClientSession() as session:
        # Fetch all Pokémon
        response = await fetch_pokemon_data(session, pokemon_url)
        all_pokemon = response["results"]

        print(f"Found {len(all_pokemon)} Pokémon. Fetching learnsets...")

        async def process_pokemon(pokemon):
            pokemon_name = pokemon["name"].replace("-", "")  # Replace '-' in Pokémon name
            pokemon_data = await fetch_pokemon_data(session, pokemon["url"])
            
            moves = {}
            for move in pokemon_data["moves"]:
                for version_group_detail in move["version_group_details"]:
                    method = version_group_detail["move_learn_method"]["name"]
                    level = version_group_detail["level_learned_at"]
                    move_name = move["move"]["name"].replace("-", "")  # Replace '-' in move name

                    # Include level-up moves
                    if method == "level-up" and level > 0:
                        if move_name not in moves or level < moves[move_name]["required_level"]:
                            moves[move_name] = {"required_level": level, "source": "level"}

                    # Include TM moves
                    elif method == "machine":
                        if move_name not in moves:
                            moves[move_name] = {"required_level": 0, "source": "tm"}

            # Convert moves dictionary to a list of dictionaries
            learnset = [
                {"name": name, **details} for name, details in sorted(moves.items(), key=lambda x: x[1]["required_level"])
            ]

            # Save the learnset to a separate JS file
            output_path = os.path.join(output_dir, f"{pokemon_name}.js")
            with open(output_path, "w") as f:
                f.write("export default ")
                json.dump(learnset, f, indent=2)
            print(f"Saved learnset: {pokemon_name}")

        # Process all Pokémon concurrently
        await asyncio.gather(*(process_pokemon(pokemon) for pokemon in all_pokemon))

    print(f"Learnset data saved to {output_dir}.")

if __name__ == "__main__":
    asyncio.run(fetch_learnsets())
