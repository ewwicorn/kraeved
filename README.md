# Kraeved

> A local travel discovery and route-planning MVP for unusual places in Krasnodar Krai and nearby regions.

Kraeved is a social travel service that helps people discover wineries, farms, nature routes, cultural spots, guest houses, and other less obvious destinations. Users browse a visual feed, save places they like, publish impressions, and generate a personalized route based on their interests.

The project was built as a hackathon MVP for the "Voronka Innovatsionnykh Startapov" event in Krasnodar, 2026.

## What It Does

- Shows a feed of travel posts with photos, tags, likes, and saved places.
- Provides user authentication with JWT access tokens.
- Stores locations, posts, users, and tags in PostgreSQL.
- Supports file uploads through MinIO, using an S3-compatible storage flow.
- Displays locations and generated routes on Yandex Maps.
- Lets users create posts, attach images, pick existing locations, or place coordinates manually.
- Includes demo seed data for tags, locations, posts, and test accounts.

## Product Idea

For travelers, the app solves the "same obvious places everywhere" problem. Instead of only showing standard tourist routes, Kraeved surfaces small local businesses, wineries, farms, caves, waterfalls, mountain routes, and personal recommendations from other users.

For local businesses, the app is a lightweight discovery channel. A small farm, winery, guest house, or guide can appear in routes when the user's interests match the place.

## User Flow

1. A user registers or logs in.
2. The user explores the feed and saves interesting posts or places.
3. The app builds a preference profile from onboarding choices and interactions.
4. The route screen generates a suggested trip with places, timing, transport context, and booking links.
5. The map screen shows saved places, user posts, and route points.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | Vanilla JavaScript, HTML5, CSS3 |
| Maps | Yandex Maps API 2.1 |
| Backend | Python 3.11, FastAPI, SQLAlchemy 2 async |
| Database | PostgreSQL 16 |
| File storage | MinIO, S3-compatible API |
| Migrations | Alembic |
| Auth | JWT bearer tokens, Passlib, bcrypt |
| Infrastructure | Docker, Docker Compose |

## Repository Structure

```text
.
|-- backend/
|   |-- app/
|   |   |-- api/v1/           # FastAPI routers: auth, posts, locations, files
|   |   |-- core/             # Settings, security, dependencies, enums
|   |   |-- db/               # SQLAlchemy base and async session setup
|   |   |-- models/           # SQLAlchemy models: User, Location, Post, Tag
|   |   |-- schemas/          # Pydantic request and response schemas
|   |   |-- services/         # Business logic and MinIO integration
|   |   |-- exceptions.py     # Shared API exceptions
|   |   |-- main.py           # FastAPI application entry point
|   |   `-- seed.py           # Demo data loader
|   |-- alembic/              # Database migrations
|   |-- Dockerfile
|   `-- pyproject.toml
|-- frontend/
|   |-- css/
|   |   `-- styles.css
|   |-- js/
|   |   |-- api.js            # API client wrappers
|   |   |-- auth.js           # Login, registration, token session restore
|   |   |-- create-post.js    # Post creation modal
|   |   |-- feed.js           # Feed rendering and filters
|   |   |-- location-modal.js # Location modal and post-location search
|   |   |-- map.js            # Yandex Maps views
|   |   |-- post-modal.js     # Full post viewer
|   |   |-- profile.js        # User profile and saved places
|   |   |-- state.js          # Shared frontend state
|   |   |-- tour.js           # Route generation UI
|   |   `-- router.js         # SPA navigation
|   `-- index.html
|-- api.json                 # Exported OpenAPI schema snapshot
`-- docker-compose.yml
```

## Quick Start

### Requirements

- Docker and Docker Compose
- Git

### Run the Project

```bash
git clone <repo-url>
cd kraeved
docker compose up -d
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.seed
```

Then open `frontend/index.html` in a browser, or serve the `frontend/` directory with any static file server.

Useful local URLs:

- API: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`
- MinIO API: `http://localhost:9000`
- MinIO console: `http://localhost:9001`

## Configuration

The Docker setup defines the required development environment variables in `docker-compose.yml`.

Important backend variables:

```env
DATABASE_URL=postgresql+asyncpg://kraytour:kraytour@postgres:5432/kraytour
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
MINIO_ENDPOINT=minio:9000
MINIO_PUBLIC_URL=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=kraytour
MINIO_SECURE=false
```

The frontend API base URL is configured in `frontend/js/config.js`:

```js
const API_BASE = 'http://localhost:8000/api/v1';
```

## API Overview

Interactive API documentation is available at `http://localhost:8000/docs` after the backend starts.

| Group | Prefix | Purpose |
| --- | --- | --- |
| Auth | `/api/v1/auth` | Register, login, current user, logout |
| Posts | `/api/v1/posts` | Feed posts, create posts, update/delete, likes |
| Locations | `/api/v1/locations` | Location list, details, tags, create/update/delete |
| Files | `/api/v1/files` | Upload media to MinIO and resolve file URLs |

## Demo Accounts

Run `python -m app.seed` inside the backend container to create demo users.

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@kraytour.ru` | `Admin1234` |
| Business seller | `seller@kraytour.ru` | `Seller1234` |
| Traveler | `buyer1@kraytour.ru` | `Buyer1234` |
| Traveler | `buyer2@kraytour.ru` | `Buyer1234` |

## Development Notes

- The backend runs with `uvicorn app.main:app --reload` in Docker.
- Alembic migrations live in `backend/alembic/versions`.
- Seed data is idempotent: rerunning `python -m app.seed` should not duplicate existing tags, users, locations, or posts.
- Uploaded public media files are served through MinIO URLs.
- The frontend is a framework-free SPA, so it can be opened directly as a static page during local development.

## Team

Developed by the Code Schrodinger team for the "Voronka Innovatsionnykh Startapov" hackathon in Krasnodar, 2026.
