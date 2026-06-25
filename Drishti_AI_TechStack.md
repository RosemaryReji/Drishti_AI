# Drishti AI - Technology Stack Document (2026)

## Project
Drishti AI — India's Climate Digital Twin

---

# Technology Stack Philosophy

Drishti AI is not a traditional web application.

It is a Climate Intelligence Platform that combines:

- Satellite Data
- GIS Systems
- AI/ML Forecasting
- Real-Time Streaming
- Digital Twin Visualization
- Disaster Management Systems
- Citizen Science Contributions

The technology stack must support:

- Massive geospatial datasets
- Real-time weather streams
- AI-powered forecasting
- Digital twin visualization
- National-scale deployment
- Future expansion to 100M+ users

---

# Frontend Stack

## Next.js 16

Why:

- Best React framework in 2026
- SEO support
- Server-side rendering
- Streaming support
- Excellent performance

Benefits:

- Fast page loads
- Better discoverability
- Easier scaling

---

## TypeScript

Why:

- Type safety
- Better maintainability
- Enterprise-grade development

---

## Tailwind CSS v5

Why:

- Fast UI development
- Design consistency
- Easy theming

---

## Shadcn/UI

Why:

- Accessible components
- Modern design
- Fully customizable

---

## TanStack Query

Why:

- Efficient API caching
- Real-time synchronization
- Better data fetching

---

# Digital Twin & Mapping Stack

## CesiumJS

Primary Digital Twin Engine

Why:

- 3D Earth visualization
- Terrain rendering
- Time playback
- Satellite tracking
- Geospatial simulations

Use Cases:

- Climate Digital Twin
- Weather Layers
- Atmospheric Visualization

---

## Deck.gl

Why:

- High-performance overlays
- Heatmaps
- Population layers
- Wind visualization

---

## MapLibre

Why:

- Open-source mapping
- No vendor lock-in
- 2D mapping support

---

# Backend Stack

## FastAPI

Primary Backend Framework

Why:

- High performance
- Python ecosystem
- AI integration
- Automatic documentation

Use Cases:

- Forecast APIs
- Alert APIs
- Climate Data APIs

---

## Pydantic

Why:

- Data validation
- Strong API contracts

---

## SQLAlchemy

Why:

- Database abstraction
- ORM support

---

## Celery

Why:

- Background jobs
- Forecast processing
- Scheduled tasks

---

## Redis

Why:

- Fast caching
- Queue management
- Session storage

---

# Artificial Intelligence Stack

## PyTorch

Primary ML Framework

Why:

- Industry standard
- Deep learning support
- Climate forecasting

Use Cases:

- Rainfall prediction
- Flood prediction
- Heatwave forecasting

---

## Hugging Face

Why:

- Pre-trained models
- NLP pipelines
- Translation workflows

---

## XGBoost

Why:

- Excellent tabular prediction
- Fast inference

Use Cases:

- Risk scoring
- Confidence estimation

---

## IndicTrans2

Why:

- Indian language translation
- Multilingual weather alerts

Supported Languages:

- Hindi
- Malayalam
- Tamil
- Telugu
- Bengali
- Marathi
- Gujarati
- Kannada
- Punjabi
- Assamese
- Odia

---

# Geospatial Stack

## PostgreSQL

Primary Database

Why:

- Reliability
- Scalability
- Open source

---

## PostGIS

Required Extension

Why:

- Geospatial queries
- Spatial indexing
- Panchayat-level forecasting

Examples:

- Villages within flood zones
- District risk mapping
- Proximity analysis

---

## GDAL

Why:

- Raster processing
- Satellite imagery handling
- GeoTIFF support

---

## GeoServer

Why:

- Geospatial APIs
- WMS services
- WMTS services

---

# Storage Layer

## AWS S3

Why:

- Durable storage
- Large datasets
- Satellite imagery archives

Stores:

- Satellite Images
- Climate Datasets
- User Uploads
- Historical Forecasts

---

## Cloudflare R2

Alternative for startup stage.

Benefits:

- Lower storage cost
- S3 compatibility

---

# Real-Time Data Infrastructure

## Apache Kafka

Why:

- Massive event streaming
- Real-time weather ingestion

Handles:

- Satellite streams
- Sensor feeds
- River gauge updates
- Citizen reports

---

## Redis Streams

Why:

- Lightweight streaming
- Notification delivery

---

# Authentication & Security

## Better Auth

Recommended Authentication System

Why:

- Open source
- Modern architecture
- Type-safe integration

Supports:

- Email Login
- Google Login
- OTP Login
- Passkeys

---

## Role-Based Access Control

Roles:

- Citizen
- Farmer
- Researcher
- Government Official
- Disaster Manager
- Administrator

---

# Search Infrastructure

## OpenSearch

Why:

- Fast search
- Scalable indexing

Use Cases:

- Search Village
- Search District
- Search Climate Records
- Search Disaster Events

---

# Notification Infrastructure

## Novu

Why:

- Unified notification platform

Supports:

- SMS
- Push Notifications
- WhatsApp
- Email

---

# Audio Warning System

## Kokoro TTS

or

## Coqui TTS

Why:

- Regional language support
- AI voice generation

Use Cases:

- Weather alerts
- Disaster warnings
- Accessibility support

---

# Deployment Strategy

## MVP Stage

### Vercel

Deploy:

- Next.js Frontend

Benefits:

- Easy deployment
- Global CDN
- Fast setup

---

### Railway

Deploy:

- FastAPI Backend

Benefits:

- Simple DevOps
- Cost-effective

---

# Production Scale

## Kubernetes

Recommended Platforms:

- AWS EKS
- Azure AKS

Benefits:

- Auto-scaling
- High availability
- Disaster recovery

---

# Cloud Infrastructure

## AWS

Recommended Services:

- EC2
- S3
- RDS
- EKS
- Lambda

---

## MeghRaj Cloud

Government Integration Layer

Benefits:

- Public-sector deployments
- Regulatory compliance

---

# Monitoring & Observability

## OpenTelemetry

Why:

- Distributed tracing
- Observability

---

## Prometheus

Why:

- Metrics collection

---

## Grafana

Why:

- Dashboards
- Infrastructure monitoring

---

# Security Stack

## Security Components

- HTTPS Everywhere
- End-to-End Encryption
- RBAC
- Audit Logging
- Rate Limiting
- Secrets Management

---

# Architecture Overview

Frontend

- Next.js
- TypeScript
- Tailwind CSS
- Shadcn/UI
- CesiumJS
- Deck.gl
- MapLibre

Backend

- FastAPI
- Pydantic
- SQLAlchemy
- Celery
- Redis

AI Layer

- PyTorch
- Hugging Face
- XGBoost
- IndicTrans2

Database

- PostgreSQL
- PostGIS

Geospatial Processing

- GDAL
- GeoServer

Real-Time Infrastructure

- Kafka
- Redis

Storage

- AWS S3
- Cloudflare R2

Authentication

- Better Auth

Search

- OpenSearch

Notifications

- Novu

Deployment

- Vercel
- Railway
- Kubernetes

Monitoring

- Grafana
- Prometheus
- OpenTelemetry

---

# Recommended MVP Stack for Hackathons

To build Drishti AI quickly and effectively:

Frontend
- Next.js
- TypeScript
- Tailwind CSS
- CesiumJS

Backend
- FastAPI

Database
- PostgreSQL + PostGIS

AI
- Hugging Face
- PyTorch

Infrastructure
- Redis
- Vercel

This MVP stack is realistic for a student team while remaining scalable toward the full Drishti AI vision.

---

# Final Recommendation

Drishti AI should be built as a Climate Operating System for India.

The recommended stack balances:

- Performance
- Scalability
- Geospatial capabilities
- AI readiness
- Government-grade reliability
- Future expansion to hundreds of millions of users
