# Bot Command System for Malkuth Platform

This system allows you to control AI bots through backend commands. You can write commands directly in the code or make API calls to trigger bot engagement.

## Available Bots

The platform comes with 5 AI personalities:

- **Luna Mystic** - Philosophical, mystical interpretations
- **Cypher Tech** - Technical analysis and detailed feedback
- **Vibe Curator** - Artistic, mood-focused responses
- **Echo Casual** - Laid-back, authentic engagement
- **Nova Enthusiast** - Energetic, supportive engagement

## Command Examples

### 1. Engage All Bots with a Specific Project

```bash
curl -X POST http://localhost:3001/api/bots/commands \
  -H "Content-Type: application/json" \
  -d '{
    "type": "engage_project",
    "projectId": "your-project-id",
    "intensity": "normal"
  }'
```

### 2. High Intensity Engagement (More Likely to Like/Comment)

```bash
curl -X POST http://localhost:3001/api/bots/commands \
  -H "Content-Type: application/json" \
  -d '{
    "type": "engage_project",
    "projectId": "your-project-id",
    "intensity": "high"
  }'
```

### 3. Engage All Published Projects

```bash
curl -X POST http://localhost:3001/api/bots/commands \
  -H "Content-Type: application/json" \
  -d '{
    "type": "engage_all_projects",
    "intensity": "normal"
  }'
```

### 4. Execute Multiple Individual Commands

```bash
curl -X POST http://localhost:3001/api/bots/commands \
  -H "Content-Type: application/json" \
  -d '{
    "type": "batch_commands",
    "commands": [
      {
        "botId": "luna_mystic",
        "action": "view",
        "projectId": "your-project-id"
      },
      {
        "botId": "cypher_tech",
        "action": "like",
        "projectId": "your-project-id"
      },
      {
        "botId": "nova_enthusiast",
        "action": "comment",
        "projectId": "your-project-id",
        "params": { "content": "Custom comment text" }
      }
    ]
  }'
```

### 5. Control Bot Active States

```bash
curl -X POST http://localhost:3001/api/bots/commands \
  -H "Content-Type: application/json" \
  -d '{
    "type": "set_bot_states",
    "bots": [
      { "botId": "luna_mystic", "active": true },
      { "botId": "cypher_tech", "active": false },
      { "botId": "vibe_curator", "active": true }
    ]
  }'
```

## Individual Bot Commands

### Single Bot Actions

```bash
# Make a specific bot view a project
curl -X POST http://localhost:3001/api/bots \
  -H "Content-Type: application/json" \
  -d '{
    "botId": "luna_mystic",
    "action": "view",
    "projectId": "your-project-id"
  }'

# Make a specific bot like a project
curl -X POST http://localhost:3001/api/bots \
  -H "Content-Type: application/json" \
  -d '{
    "botId": "cypher_tech",
    "action": "like",
    "projectId": "your-project-id"
  }'

# Make a specific bot comment on a project
curl -X POST http://localhost:3001/api/bots \
  -H "Content-Type: application/json" \
  -d '{
    "botId": "nova_enthusiast",
    "action": "comment",
    "projectId": "your-project-id"
  }'

# Simulate natural activity (view + potential like + potential comment)
curl -X POST http://localhost:3001/api/bots \
  -H "Content-Type: application/json" \
  -d '{
    "botId": "vibe_curator",
    "action": "simulate_activity",
    "projectId": "your-project-id"
  }'
```

## Integration Examples

### In Your Backend Code

```javascript
// Example: Auto-engage bots when a project is published
const engageBots = async (projectId) => {
  const response = await fetch('http://localhost:3001/api/bots/commands', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'engage_project',
      projectId: projectId,
      intensity: 'normal'
    })
  });
  
  const result = await response.json();
  console.log('Bot engagement result:', result);
};

// Example: Schedule periodic bot activity
setInterval(async () => {
  await fetch('http://localhost:3001/api/bots/commands', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'engage_all_projects',
      intensity: 'normal'
    })
  });
}, 300000); // Every 5 minutes
```

### Python Example

```python
import requests
import time

def engage_project(project_id, intensity="normal"):
    response = requests.post(
        "http://localhost:3001/api/bots/commands",
        json={
            "type": "engage_project",
            "projectId": project_id,
            "intensity": intensity
        }
    )
    return response.json()

def schedule_bot_activity():
    while True:
        requests.post(
            "http://localhost:3001/api/bots/commands",
            json={
                "type": "engage_all_projects",
                "intensity": "normal"
            }
        )
        time.sleep(300)  # Wait 5 minutes
```

## Monitoring Bot Activity

```bash
# Get all bot activity
curl http://localhost:3001/api/bots/activity

# Get activity for a specific project
curl "http://localhost:3001/api/bots/activity?projectId=your-project-id"

# Get current bot states
curl http://localhost:3001/api/bots
```

## Admin Interface

Visit `http://localhost:3001/admin/bots` to access the visual bot management interface where you can:

- View all bot personalities and their engagement probabilities
- Activate/deactivate individual bots
- Execute quick actions on projects
- Monitor real-time bot activity
- View command execution results

## Bot Personalities Explained

Each bot has different engagement patterns:

- **View Probability**: Chance of viewing when triggered (0.6-0.95)
- **Like Probability**: Chance of liking after viewing (0.6-0.9)
- **Comment Probability**: Chance of commenting after viewing (0.3-0.8)
- **Preferred Types**: Content types they're most interested in
- **Engagement Style**: Determines comment tone and style

Comments are generated based on the bot's personality and style, creating authentic-feeling engagement patterns.