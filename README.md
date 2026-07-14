# M&E Donor Dashboard & Conversational RAG Engine

## Project Objective
To provide external donors and global funding partners with an interactive, transparent pathway to audit our Monitoring & Evaluation (M&E) social impact metrics. This system delivers an intuitive visual analytics dashboard paired with a context-grounded AI conversational assistant that accurately answers donor queries using only approved text data layers.

## Technical Architecture & Stack
*   **AI Framework & Ingestion:** 
*   **LLM:** 
*   **Vector Database:** 
*   **Frontend Engine:** 
*   **QA Validation:** 

## Project Scope
### In Scope
*   **Data Sanitation:** Clean, audit, and structure historical M&E datasets to remove sensitive parameters.
*   **Visual Engineering:** Build a frontend analytics interface displaying high-level impact milestones.
*   **RAG System Engineering:** Deploy a semantic search loop restricting chatbot responses strictly to cleared context.
*   **Rigorous QA Gates:** Run automated code and security repository audits before staging deployments.

### Out of Scope
*   Strictly zero administrative or data editing permissions for external users over underlying databases.
*   No active real-time data sync loops (unless explicitly requested and scoped with the lead).
*   Zero ingestion or visibility of any data layer not formally cleared for public viewing.

## Git Workflow & Branch Strategy
*   **Local Feature Branches:** All active development happens on local feature branches.
*   **Staging Branch:** Open a Pull Request (PR) to the shared `staging` branch for internal user validation.
*   **Main Branch:** Merges to `main` occur only upon final production release.

