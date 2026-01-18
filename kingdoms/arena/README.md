# Arena Battle System

The Arena is a battle simulation system that allows teams to fight against each other in controlled combat scenarios.

## Features

### Team Types
- **Kingdom Teams**: Use emergency soldiers from a selected kingdom
- **Anonymous Teams**: Use any soldiers with custom quantities

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
   - If Kingdom: Select a kingdom and use their emergency soldiers
   - If Anonymous: Add any soldiers with custom quantities

2. **Set up Team 2**:
   - Same options as Team 1
   - Can mix kingdom and anonymous teams

3. **Configure Battle**:
   - Select battle strategy (Sabotage/Occupy/Harvest)
   - Click "Start Battle"

4. **View Results**:
   - See winner, scores, and analysis
   - Review casualties and battle commentary
   - Start new battle or reset teams

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