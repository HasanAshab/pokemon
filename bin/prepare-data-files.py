import re
import json

# File paths
input_file = "data/moves.js"
output_file = "db/moves.js"

def parse_moves_js(file_path):
    """Reads and parses the moves.js file into a Python dictionary."""
    with open(file_path, "r") as file:
        content = file.read()

    # Extract the JSON-like object from the file (ignoring `export default`)
    json_start = content.find("{")
    json_content = content[json_start:]

    # Use eval to handle the JSON-like format
    moves_data = eval(json_content, {"true": True, "false": False, "null": None})

    return moves_data

def update_pp_values(moves):
    """Divides and rounds all move pp values by 3."""
    for move_name, move_data in moves.items():
        if "pp" in move_data and isinstance(move_data["pp"], (int, float)):
            move_data["pp"] = round(move_data["pp"] / 3)

def write_moves_js(file_path, moves):
    """Writes the updated moves back to the moves.js file."""
    with open(file_path, "w") as file:
        file.write("export default ")
        json_content = json.dumps(moves, indent=2)
        json_content = json_content.replace("true", "true").replace("false", "false").replace("null", "null")
        file.write(json_content)

if __name__ == "__main__":
    # Read, update, and write the moves data
    moves_data = parse_moves_js(input_file)
    update_pp_values(moves_data)
    write_moves_js(output_file, moves_data)
    print(f"Updated moves have been saved to {output_file}")
