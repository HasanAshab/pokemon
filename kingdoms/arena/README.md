# Arena Battle System

The Arena is a battle simulation system that allows teams to fight against each other in controlled combat scenarios.

## Features

### Team Types
- **Kingdom Teams**: Use emergency soldiers from a selected kingdom
  - Automatically loads all available emergency troops when kingdom is selected
  - Shows available quantities for each soldier type
  - Validates quantities against available troops
- **Anonymous Teams**: Use any soldiers with custom quantities
  - Text input with autocomplete datalist of all available pokemon IDs
  - No quantity restrictions

### Automatic Features
- **Auto-load Troops**: When selecting a kingdom, all emergency soldiers are automatically added
- **Smart Input**: Anonymous teams get text input with datalist, kingdom teams get dropdown
- **Quantity Validation**: Automatically fixes quantities that exceed available troops
- **Visual Feedback**: Invalid quantities are highlighted and auto-corrected

### Battle Mechanics
- Uses the same war system as kingdom battles
- Three battle strategies: Sabotage, Occupy, Harvest
- Dummy commanders with minimal IQ (0.1 offensive/defensive)
- Real-time battle calculations with detailed results

### Team Management
- Add/remove soldiers dynamically
- Adjust soldier quantities
- Switch between kingdom and anonymous modes
- Visual feedback for team composition

### Battle Results
- Winner determination
- Score comparison and analysis
- Casualty reports
- Battle commentary
- Score difference calculations

## Usage

1. **Set up Team 1**:
   - Choose between Kingdom or Anonymous team
   - **Kingdom Mode**: 
     - Select a kingdom from dropdown
     - All emergency soldiers are automatically loaded
     - Modify quantities as needed (auto-validates against available troops)
   - **Anonymous Mode**: 
     - Type soldier names using autocomplete
     - Set any quantities desired

2. **Set up Team 2**:
   - Same options as Team 1
   - Can mix kingdom and anonymous teams

3. **Configure Battle**:
   - Select battle strategy (Sabotage/Occupy/Harvest)
   - Click "Start Battle"

4. **View Results**:
   - See winner, scores, and analysis
   - Review casualties and battle commentary
   - **Click "Confirm Battle Results"** to apply changes to kingdom data
   - Results are pending until confirmed - no kingdom data is modified until confirmation

### Input Validation
- Kingdom teams: Quantities automatically capped at available troops
- Invalid quantities are highlighted in red and auto-corrected
- Minimum quantity is always 1
- Anonymous teams have no quantity restrictions

### Battle Results Confirmation
- Battle results are displayed immediately but **not applied** to kingdom data
- A warning message indicates results are pending confirmation
- Click "Confirm Battle Results" to apply casualties and save changes
- Once confirmed, the button becomes disabled and shows "✓ Confirmed"
- Kingdom soldier counts are only updated after confirmation
- Anonymous teams are not affected by confirmation (no kingdom data to update)

## Technical Details

### Battle System Integration
- Uses `WAR_SYSTEMS` from `../war.js`
- Creates `AttackWave` and `DefenseWave` instances
- Applies soldier imbalance penalties for kingdom teams
- Handles wounded soldiers for kingdom teams only

### Data Management
- Reads kingdom data from localStorage
- Updates kingdom soldier counts after battles
- Preserves anonymous team data during session

### UI Components
- Responsive grid layout for teams
- Dynamic soldier management
- Real-time battle result display
- Mobile-friendly design

## Battle Strategies

- **Sabotage**: Maximum destruction, no direct profit
- **Occupy**: Occupy attacked land, requires 30% stronger might
- **Harvest**: Peaceful win with large might advantage, war with equal might

## Limitations

- Anonymous teams don't affect kingdom data
- Only emergency soldiers available for kingdom teams
- Dummy commanders have fixed low IQ values
- No territory or resource effects in arena battles