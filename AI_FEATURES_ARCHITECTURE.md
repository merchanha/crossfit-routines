# CrossFit Routines AI Features - Architecture Documentation

## Table of Contents
1. [System Context Diagram (C4 Level 1)](#system-context-diagram)
2. [Container Diagram (C4 Level 2)](#container-diagram)
3. [Component Diagram - Backend (C4 Level 3)](#component-diagram-backend)
4. [AI Integration Flow Diagrams](#ai-integration-flow-diagrams)
5. [Implementation Roadmap](#implementation-roadmap)

---

## System Context Diagram (C4 Level 1)

Shows the big picture: how users interact with the system and external dependencies.

```mermaid
C4Context
    title System Context Diagram - CrossFit Routines Platform

    Person(user, "CrossFit User", "User managing workouts and routines")
    
    System(crossfitApp, "CrossFit Routines Platform", "Web application for managing workout routines, scheduling, and AI-powered recommendations")
    
    System_Ext(openai, "OpenAI API", "GPT-4 for routine generation and recommendations")
    System_Ext(gemini, "Google Gemini API", "Alternative AI provider for routine generation")
    System_Ext(youtube, "YouTube Data API", "Search and retrieve workout videos")
    System_Ext(cloudinary, "Cloudinary", "Image storage and management")
    System_Ext(renderDB, "Render PostgreSQL", "Production database")
    
    Rel(user, crossfitApp, "Uses", "HTTPS")
    Rel(crossfitApp, openai, "Generates routines and recommendations", "HTTPS/REST")
    Rel(crossfitApp, gemini, "Alternative AI provider", "HTTPS/REST")
    Rel(crossfitApp, youtube, "Fetches workout videos", "HTTPS/REST")
    Rel(crossfitApp, cloudinary, "Stores/retrieves profile images", "HTTPS/REST")
    Rel(crossfitApp, renderDB, "Reads/writes data", "PostgreSQL")
    
    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="2")
```

---

## Container Diagram (C4 Level 2)

Shows the high-level technical building blocks.

```mermaid
C4Container
    title Container Diagram - CrossFit Routines Platform

    Person(user, "CrossFit User")

    Container_Boundary(frontend, "Frontend Layer") {
        Container(spa, "Single Page App", "React + TypeScript + Vite", "Provides UI for workout management and AI features")
    }

    Container_Boundary(backend, "Backend Layer") {
        Container(api, "API Application", "NestJS + TypeScript", "Handles business logic, authentication, and AI integration")
        ContainerDb(db, "Database", "PostgreSQL", "Stores users, routines, workouts, AI interactions")
    }

    Container_Boundary(aiServices, "AI Services Layer") {
        Container(aiOrchestrator, "AI Orchestrator", "NestJS Service", "Routes requests to appropriate AI provider")
        Container(recommendationEngine, "Recommendation Engine", "NestJS Service", "Analyzes user data and generates recommendations")
        Container(routineGenerator, "Routine Generator", "NestJS Service", "Creates complete routines from high-level descriptions")
    }

    System_Ext(openai, "OpenAI API")
    System_Ext(gemini, "Google Gemini API")
    System_Ext(youtube, "YouTube Data API")
    System_Ext(cloudinary, "Cloudinary")

    Rel(user, spa, "Uses", "HTTPS")
    Rel(spa, api, "Makes API calls", "JSON/HTTPS")
    Rel(api, db, "Reads/writes", "TypeORM")
    Rel(api, aiOrchestrator, "Requests AI operations")
    Rel(aiOrchestrator, recommendationEngine, "Requests recommendations")
    Rel(aiOrchestrator, routineGenerator, "Requests routine generation")
    Rel(recommendationEngine, openai, "Analyzes workout data", "HTTPS/REST")
    Rel(recommendationEngine, gemini, "Fallback provider", "HTTPS/REST")
    Rel(routineGenerator, openai, "Generates routines", "HTTPS/REST")
    Rel(routineGenerator, gemini, "Fallback provider", "HTTPS/REST")
    Rel(routineGenerator, youtube, "Fetches videos", "HTTPS/REST")
    Rel(api, cloudinary, "Manages images", "HTTPS/REST")

    UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="1")
```

---

## Component Diagram - Backend (C4 Level 3)

Detailed view of backend components with AI integration.

```mermaid
C4Component
    title Component Diagram - Backend API with AI Integration

    Container_Boundary(api, "API Application") {
        Component(authModule, "Auth Module", "NestJS Module", "Handles authentication and authorization")
        Component(usersModule, "Users Module", "NestJS Module", "Manages user data and profiles")
        Component(routinesModule, "Routines Module", "NestJS Module", "CRUD operations for routines")
        Component(scheduledWorkoutsModule, "Scheduled Workouts Module", "NestJS Module", "Manages workout scheduling")
        Component(notesModule, "Notes Module", "NestJS Module", "Workout notes and feedback")
        
        Component(aiModule, "AI Module", "NestJS Module", "NEW - Orchestrates AI operations")
        Component(recommendationsModule, "Recommendations Module", "NestJS Module", "NEW - Generates personalized recommendations")
        Component(generatorModule, "Generator Module", "NestJS Module", "NEW - AI-powered routine generation")
    }

    Container_Boundary(aiServices, "AI Services") {
        Component(aiProviderInterface, "AI Provider Interface", "TypeScript Interface", "Abstract interface for AI providers")
        Component(openaiService, "OpenAI Service", "NestJS Service", "OpenAI API integration")
        Component(geminiService, "Gemini Service", "NestJS Service", "Google Gemini integration")
        Component(aiProviderFactory, "AI Provider Factory", "NestJS Service", "Selects appropriate AI provider")
        
        Component(youtubeService, "YouTube Service", "NestJS Service", "YouTube Data API integration")
        Component(performanceAnalyzer, "Performance Analyzer", "NestJS Service", "Analyzes workout performance deltas")
        Component(recommendationBuilder, "Recommendation Builder", "NestJS Service", "Builds recommendation payloads")
    }

    ContainerDb(db, "Database", "PostgreSQL")

    Rel(aiModule, aiProviderFactory, "Gets AI provider")
    Rel(aiProviderFactory, openaiService, "Primary provider")
    Rel(aiProviderFactory, geminiService, "Fallback provider")
    
    Rel(recommendationsModule, performanceAnalyzer, "Analyzes user data")
    Rel(recommendationsModule, recommendationBuilder, "Builds recommendations")
    Rel(recommendationsModule, aiModule, "Requests AI analysis")
    Rel(recommendationsModule, routinesModule, "Fetches user routines")
    Rel(recommendationsModule, scheduledWorkoutsModule, "Fetches workout history")
    
    Rel(generatorModule, aiModule, "Requests routine generation")
    Rel(generatorModule, youtubeService, "Fetches video URLs")
    Rel(generatorModule, routinesModule, "Saves generated routines")
    
    Rel(routinesModule, db, "CRUD operations")
    Rel(scheduledWorkoutsModule, db, "CRUD operations")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

---

## AI Integration Flow Diagrams

### Feature 1: AI-Powered Recommendations

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant RecommendationsController
    participant RecommendationsService
    participant PerformanceAnalyzer
    participant AIProviderFactory
    participant OpenAI
    participant RoutinesService
    participant DB

    User->>Frontend: Requests recommendations
    Frontend->>RecommendationsController: GET /api/recommendations
    
    RecommendationsController->>RecommendationsService: getRecommendations(userId)
    
    Note over RecommendationsService: Step 1: Analyze User Performance
    RecommendationsService->>PerformanceAnalyzer: analyzeWorkoutHistory(userId)
    PerformanceAnalyzer->>DB: Fetch scheduled workouts with finalDuration
    DB-->>PerformanceAnalyzer: Workout history
    PerformanceAnalyzer-->>RecommendationsService: Performance metrics (avg delta, trends, strengths, weaknesses)
    
    Note over RecommendationsService: Step 2: Get User's Existing Routines
    RecommendationsService->>RoutinesService: findAll(userId)
    RoutinesService->>DB: SELECT routines WHERE userId
    DB-->>RoutinesService: User routines
    RoutinesService-->>RecommendationsService: Existing routines
    
    Note over RecommendationsService: Step 3: Generate AI Recommendations
    RecommendationsService->>AIProviderFactory: getProvider()
    AIProviderFactory-->>RecommendationsService: OpenAI instance
    
    RecommendationsService->>OpenAI: generateRecommendations({<br/>performanceData,<br/>existingRoutines,<br/>userPreferences})
    OpenAI-->>RecommendationsService: AI-generated recommendations
    
    Note over RecommendationsService: Step 4: Build Response
    RecommendationsService->>RecommendationsService: mergeExistingAndNewRoutines()
    RecommendationsService-->>RecommendationsController: Recommendations list
    
    RecommendationsController-->>Frontend: JSON response
    Frontend-->>User: Display recommendations
```

### Feature 2: Natural Language Routine Generator

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant GeneratorController
    participant GeneratorService
    participant AIProviderFactory
    participant OpenAI
    participant YouTubeService
    participant RoutinesService
    participant DB

    User->>Frontend: Enters: "cardio workout for 2 people, 40 minutes"
    Frontend->>GeneratorController: POST /api/generator/create<br/>{prompt: "cardio...", saveToLibrary: true}
    
    GeneratorController->>GeneratorService: generateRoutine(userId, prompt, options)
    
    Note over GeneratorService: Step 1: Parse and Enrich Prompt
    GeneratorService->>GeneratorService: buildPromptContext(prompt)
    
    Note over GeneratorService: Step 2: Get AI Provider
    GeneratorService->>AIProviderFactory: getProvider()
    AIProviderFactory-->>GeneratorService: OpenAI instance
    
    Note over GeneratorService: Step 3: Generate Routine Structure
    GeneratorService->>OpenAI: generateRoutine({<br/>prompt,<br/>functionalFitnessRules,<br/>outputSchema})
    OpenAI-->>GeneratorService: {name, description, exercises[], estimatedDuration}
    
    Note over GeneratorService: Step 4: Find Relevant Video
    GeneratorService->>YouTubeService: searchVideo(routineName, exerciseKeywords)
    YouTubeService-->>GeneratorService: videoUrl
    
    Note over GeneratorService: Step 5: Save to Database (if requested)
    alt User wants to save
        GeneratorService->>RoutinesService: create(routineDto, userId)
        RoutinesService->>DB: INSERT routine
        DB-->>RoutinesService: Saved routine
        RoutinesService-->>GeneratorService: Routine with ID
    end
    
    GeneratorService-->>GeneratorController: Complete routine object
    GeneratorController-->>Frontend: JSON response
    Frontend-->>User: Display generated routine with preview
```

### AI Provider Selection Flow

```mermaid
flowchart TD
    A[AI Request Initiated] --> B{Check Provider Config}
    B --> C{Primary: OpenAI}
    C -->|Available| D[Call OpenAI API]
    C -->|Unavailable/Error| E{Fallback: Gemini}
    
    D -->|Success| F[Return Result]
    D -->|Error| G{Retry Logic}
    G -->|Retries Exhausted| E
    G -->|Retry| D
    
    E -->|Available| H[Call Gemini API]
    E -->|Unavailable| I[Return Error]
    
    H -->|Success| F
    H -->|Error| I
    
    F --> J[Cache Result if Applicable]
    J --> K[Return to Consumer]
    
    I --> L[Log Error]
    L --> M[Return Fallback/Error Response]
```

---

## Database Schema Updates

### New Tables

```mermaid
erDiagram
    USERS ||--o{ ROUTINES : creates
    USERS ||--o{ SCHEDULED_WORKOUTS : schedules
    ROUTINES ||--o{ SCHEDULED_WORKOUTS : "scheduled as"
    USERS ||--o{ AI_INTERACTIONS : has
    USERS ||--o{ RECOMMENDATIONS : receives
    RECOMMENDATIONS ||--o{ RECOMMENDATION_ITEMS : contains
    ROUTINES ||--o| RECOMMENDATION_ITEMS : "may reference"
    
    USERS {
        uuid id PK
        string email
        string name
        string profilePicture
        timestamp createdAt
    }
    
    ROUTINES {
        uuid id PK
        uuid userId FK
        string name
        text description
        string videoUrl
        int estimatedDuration
        jsonb exercises
        boolean aiGenerated "NEW"
        timestamp createdAt
    }
    
    SCHEDULED_WORKOUTS {
        uuid id PK
        uuid userId FK
        uuid routineId FK
        string date
        boolean completed
        int finalDuration
        text notes
        timestamp createdAt
    }
    
    AI_INTERACTIONS {
        uuid id PK "NEW TABLE"
        uuid userId FK
        string interactionType "recommendation|generation"
        text prompt
        jsonb response
        string aiProvider "openai|gemini"
        int tokensUsed
        timestamp createdAt
    }
    
    RECOMMENDATIONS {
        uuid id PK "NEW TABLE"
        uuid userId FK
        jsonb performanceAnalysis
        string status "pending|viewed|dismissed"
        timestamp createdAt
        timestamp expiresAt
    }
    
    RECOMMENDATION_ITEMS {
        uuid id PK "NEW TABLE"
        uuid recommendationId FK
        uuid routineId FK "nullable - null if AI-generated"
        string itemType "existing|ai_generated"
        text reasoning
        int priority
        jsonb routineData "for AI-generated routines"
    }
```

---

## Technology Stack

### Existing Technologies
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, React Router
- **Backend**: NestJS, TypeScript, TypeORM
- **Database**: PostgreSQL (Render)
- **Authentication**: JWT, bcrypt
- **Image Storage**: Cloudinary (pluggable architecture)
- **Deployment**: Vercel (Frontend), Render (Backend)

### New Technologies (AI Features)
- **OpenAI SDK**: `openai` npm package (GPT-4/GPT-3.5-turbo)
- **Google Generative AI**: `@google/generative-ai` (Gemini Pro)
- **YouTube Data API**: `googleapis` npm package
- **Caching**: Redis or in-memory cache for AI responses (optional optimization)
- **Rate Limiting**: `@nestjs/throttler` for AI endpoint protection

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
**Goal**: Set up AI infrastructure and provider abstraction

#### Backend Tasks
1. ✅ Create AI Module structure
   - `src/ai/` directory
   - `ai.module.ts` with provider configuration
   
2. ✅ Implement AI Provider Interface
   - Abstract `AIProviderInterface` with standard methods
   - `generateCompletion(prompt, options)`
   - `generateStructuredOutput(prompt, schema, options)`
   
3. ✅ Implement OpenAI Service
   - OpenAI SDK integration
   - Error handling and retries
   - Token usage tracking
   
4. ✅ Implement Gemini Service
   - Google Generative AI SDK integration
   - Map to common interface
   
5. ✅ Create AI Provider Factory
   - Environment-based provider selection
   - Fallback logic
   
6. ✅ Database Migrations
   - Create `ai_interactions` table
   - Add `aiGenerated` flag to `routines` table

#### Frontend Tasks
1. ✅ Create AI context/hooks
   - `useAIGenerator` hook
   - `useRecommendations` hook

#### Environment Variables
```env
# AI Provider Configuration
AI_PROVIDER=openai # or gemini
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-pro

# YouTube API
YOUTUBE_API_KEY=...

# Rate Limiting
AI_RATE_LIMIT_TTL=60
AI_RATE_LIMIT_REQUESTS=10
```

---

### Phase 2: Feature 1 - AI Recommendations (Week 3-4)
**Goal**: Implement personalized routine recommendations

#### Backend Tasks
1. ✅ Create Recommendations Module
   - `src/recommendations/` directory
   - Controller, Service, DTOs
   
2. ✅ Implement Performance Analyzer
   - Calculate average delta (estimatedDuration vs finalDuration)
   - Identify patterns (improving, plateauing, declining)
   - Detect strengths and weaknesses by exercise type
   
3. ✅ Database Migrations
   - Create `recommendations` table
   - Create `recommendation_items` table
   
4. ✅ Implement Recommendation Builder
   - Fetch user's existing routines
   - Analyze workout history
   - Generate AI prompt with context
   - Parse AI response
   - Merge existing + new routine suggestions
   
5. ✅ Create API Endpoints
   - `GET /api/recommendations` - Get current recommendations
   - `POST /api/recommendations/generate` - Force regenerate
   - `PATCH /api/recommendations/:id` - Mark as viewed/dismissed
   
6. ✅ Implement Caching Strategy (optional)
   - Cache recommendations for 24 hours
   - Invalidate on new workout completion

#### Frontend Tasks
1. ✅ Create Recommendations View
   - New route: `/recommendations`
   - Display performance insights
   - Show existing routine recommendations
   - Show AI-generated routine suggestions
   - "Add to Library" button for AI suggestions
   
2. ✅ Update Dashboard
   - Add "Recommendations" card/widget
   - Quick preview of top 3 recommendations
   
3. ✅ Update Navigation
   - Add Recommendations link to sidebar

#### API Response Example
```json
{
  "id": "uuid",
  "userId": "uuid",
  "performanceAnalysis": {
    "avgDelta": -5.2,
    "trend": "improving",
    "workoutsAnalyzed": 15,
    "strengths": ["cardio", "endurance"],
    "weaknesses": ["strength", "olympic lifts"]
  },
  "recommendations": [
    {
      "id": "uuid",
      "type": "existing",
      "routine": {
        "id": "uuid",
        "name": "Cindy",
        "description": "20 min AMRAP...",
        "estimatedDuration": 20
      },
      "reasoning": "You've been improving in cardio workouts. This routine matches your current fitness level and will help maintain your progress.",
      "priority": 1
    },
    {
      "id": "uuid",
      "type": "ai_generated",
      "routine": {
        "name": "Strength Builder Pro",
        "description": "Focus on olympic lifts...",
        "exercises": [...],
        "estimatedDuration": 35,
        "videoUrl": "https://youtube.com/..."
      },
      "reasoning": "Based on your performance data, you show potential in strength movements but need more structured practice. This routine targets your weakness areas.",
      "priority": 2
    }
  ],
  "createdAt": "2025-10-06T00:00:00Z",
  "expiresAt": "2025-10-07T00:00:00Z"
}
```

---

### Phase 3: Feature 2 - Natural Language Routine Generator (Week 5-6)
**Goal**: Generate complete routines from text descriptions

#### Backend Tasks
1. ✅ Create Generator Module
   - `src/generator/` directory
   - Controller, Service, DTOs
   
2. ✅ Implement YouTube Service
   - Search videos by keywords
   - Filter for workout/fitness content
   - Return top relevant video
   
3. ✅ Create Prompt Templates
   - Base prompt with functional fitness rules
   - Output schema definition (JSON)
   - Examples for few-shot learning
   
4. ✅ Implement Routine Generator Service
   - Parse natural language input
   - Extract key parameters (duration, focus, participants)
   - Build AI prompt with context
   - Validate AI response
   - Fetch appropriate video
   - Option to save to user's library
   
5. ✅ Create API Endpoints
   - `POST /api/generator/create` - Generate routine from text
   - `POST /api/generator/preview` - Preview without saving
   - `POST /api/generator/save/:id` - Save generated routine
   
6. ✅ Add Validation
   - Ensure generated exercises have valid sets/reps
   - Validate estimated duration is reasonable
   - Check for duplicate exercise names

#### Frontend Tasks
1. ✅ Create Generator View/Modal
   - Text input for description
   - "Generate" button
   - Loading state with progress
   - Preview generated routine
   - "Save to Library" button
   - "Regenerate" button
   
2. ✅ Add to Multiple Entry Points
   - Dashboard: "Generate Routine with AI" card
   - Routines Library: "Generate with AI" button
   - Calendar: When scheduling, offer "Generate new routine"
   
3. ✅ Real-time Validation
   - Character limits
   - Show example prompts
   - Preview mode before saving

#### API Request/Response Examples

**Request**:
```json
{
  "prompt": "A cardio-focused workout for two people lasting 40 minutes",
  "saveToLibrary": false,
  "preferences": {
    "difficulty": "intermediate",
    "equipment": "minimal"
  }
}
```

**Response**:
```json
{
  "id": "temp-uuid",
  "name": "Partner Cardio Blitz",
  "description": "High-intensity cardio workout designed for two partners, focusing on aerobic capacity and endurance. Perfect for 40-minute session.",
  "estimatedDuration": 40,
  "videoUrl": "https://youtube.com/watch?v=...",
  "exercises": [
    {
      "id": "gen-1",
      "name": "Synchronized Burpees",
      "sets": 4,
      "reps": 15,
      "notes": "Partners perform burpees in sync. Take 90 seconds rest between sets."
    },
    {
      "id": "gen-2",
      "name": "Partner Wall Balls",
      "sets": 5,
      "reps": 20,
      "notes": "Partners throw wall ball to each other. Alternate catches."
    },
    {
      "id": "gen-3",
      "name": "Double Jump Rope",
      "sets": 3,
      "reps": 100,
      "notes": "Each partner completes 100 jumps. Can be done simultaneously or alternating."
    }
  ],
  "aiGenerated": true,
  "saved": false,
  "generatedAt": "2025-10-06T10:30:00Z"
}
```

---

### Phase 4: Enhancements & Optimization (Week 7-8)
**Goal**: Improve performance, UX, and add advanced features

#### Backend Tasks
1. ✅ Implement Caching Layer
   - Redis or in-memory cache for AI responses
   - Cache similar prompts
   - Reduce API costs
   
2. ✅ Add Rate Limiting
   - Protect AI endpoints from abuse
   - Per-user limits
   - Graceful degradation
   
3. ✅ Implement Usage Analytics
   - Track AI token usage per user
   - Monitor costs
   - Add usage dashboards
   
4. ✅ Error Handling & Retries
   - Exponential backoff for API failures
   - Graceful fallback messages
   - Better error messages for users
   
5. ✅ Add Admin Endpoints
   - View AI usage statistics
   - Manage AI provider configuration
   - Monitor system health

#### Frontend Tasks
1. ✅ Add Loading States
   - Skeleton screens
   - Progress indicators for AI operations
   - Estimated time remaining
   
2. ✅ Implement Favorites/Bookmarks
   - Save favorite AI-generated routines
   - Quick access to recommendations
   
3. ✅ Add Feedback Mechanism
   - Thumbs up/down on recommendations
   - "Not relevant" button
   - Improve AI over time
   
4. ✅ Performance Insights Dashboard
   - Visualize workout deltas over time
   - Show AI recommendation impact
   - Track improvement metrics

#### Optional Advanced Features
- **Voice Input**: Use Web Speech API for voice-to-text routine generation
- **Image Upload**: Analyze gym equipment photos to suggest routines
- **Social Sharing**: Share AI-generated routines with community
- **Routine Variations**: Ask AI to create variations of existing routines
- **Progressive Overload**: AI suggests incremental difficulty increases

---

## Cost Estimation

### OpenAI API Costs (GPT-4 Turbo)
- **Input**: $0.01 / 1K tokens
- **Output**: $0.03 / 1K tokens

**Estimated usage per request**:
- Recommendation generation: ~2K tokens input + 1K output = $0.05/request
- Routine generation: ~1K tokens input + 800 output = $0.034/request

**Monthly costs** (for 100 active users):
- Recommendations: 100 users × 4 times/month × $0.05 = $20
- Routine generation: 100 users × 10 times/month × $0.034 = $34
- **Total**: ~$54/month

### YouTube Data API
- **Free tier**: 10,000 units/day (sufficient for this use case)
- **Cost**: $0 (within free tier)

### Mitigation Strategies
1. Implement aggressive caching (24-48 hour TTL)
2. Rate limit AI requests per user
3. Use GPT-3.5-turbo for less critical requests (10x cheaper)
4. Batch requests when possible
5. Add usage quota per user tier

---

## Security Considerations

1. **API Key Protection**
   - Store in environment variables
   - Never expose to frontend
   - Rotate keys regularly
   
2. **Rate Limiting**
   - Prevent abuse of AI endpoints
   - Per-user quotas
   - IP-based throttling
   
3. **Input Validation**
   - Sanitize user prompts
   - Prevent prompt injection
   - Maximum length limits
   
4. **Output Validation**
   - Validate AI-generated exercises
   - Ensure safe workout recommendations
   - Filter inappropriate content
   
5. **Cost Control**
   - Set maximum token limits per request
   - Monitor and alert on unusual usage
   - Implement spending caps

---

## Testing Strategy

### Unit Tests
- AI Provider services (mocked API responses)
- Performance Analyzer logic
- Recommendation Builder
- Prompt generation utilities

### Integration Tests
- End-to-end AI flow (with test API keys)
- Database interactions
- API endpoint responses

### E2E Tests (Frontend)
- User journey: Request recommendations → View → Save
- User journey: Generate routine → Preview → Save
- Error handling flows

---

## Monitoring & Observability

### Metrics to Track
1. **AI Performance**
   - Response times
   - Error rates
   - Token usage
   - Provider fallback frequency
   
2. **Feature Adoption**
   - Recommendation views
   - Routine generations
   - Save rates
   - User engagement
   
3. **Costs**
   - Daily/weekly/monthly AI API spend
   - Cost per user
   - ROI metrics

### Logging
- All AI requests/responses (sanitized)
- Performance analysis results
- User interactions with AI features
- Errors and fallbacks

---

## Next Steps

**Immediate Actions**:
1. ✅ Review and approve architecture
2. ✅ Decide on AI provider priority (OpenAI vs Gemini)
3. ✅ Obtain API keys (OpenAI, Gemini, YouTube)
4. ✅ Start Phase 1 implementation

**Questions to Answer**:
1. Should we implement caching from Day 1 or in Phase 4?
2. What user tier/quota system do we want? (if any)
3. Should recommendations auto-regenerate daily or on-demand only?
4. Do we want to store AI-generated routines permanently or as temporary previews?

---

## Appendix: Example Prompts

### Recommendation Generation Prompt Template
```
You are a CrossFit coach analyzing an athlete's performance data.

User Performance Data:
- Total workouts completed: {count}
- Average duration delta: {avgDelta} minutes (negative = faster than estimated)
- Performance trend: {trend}
- Strongest areas: {strengths}
- Areas for improvement: {weaknesses}

User's Existing Routines:
{routinesList}

Based on this data, generate 5 personalized workout recommendations:
1. Include 2-3 of the user's existing routines that match their current fitness level
2. Generate 2-3 NEW routines that address their weaknesses while leveraging strengths

For each recommendation, provide:
- Routine name and description
- Estimated duration
- Reasoning for why this routine is recommended
- Priority level (1-5)

Format the response as JSON matching this schema:
{schema}
```

### Routine Generation Prompt Template
```
You are an expert functional fitness coach creating a workout routine.

User Request: "{userPrompt}"

Generate a complete workout routine following these functional fitness principles:
- Varied functional movements
- High intensity
- Scalable to different fitness levels
- Safe and effective exercise selection
- Appropriate work-to-rest ratios

Output a JSON object with:
- name: Creative, motivating routine name
- description: Detailed description (2-3 sentences)
- estimatedDuration: Total time in minutes
- exercises: Array of exercises with:
  - name: Exercise name
  - sets: Number of sets
  - reps: Number of reps (or "AMRAP", "time")
  - notes: Coaching cues and modifications

Ensure the routine is practical, safe, and matches the user's request.

JSON Schema:
{schema}
```


