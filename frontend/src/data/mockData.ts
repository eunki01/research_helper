// src/data/mockData.ts

export const paperData = {
    centralPaper: {
      id: "DOI-12345",
      title: "The Core Concepts of RAG",
      authors: ["Author A", "Author B"],
      year: 2024,
      abstract: "This paper explores the fundamental principles of Retrieval-Augmented Generation (RAG), a technique to improve large language models."
    },
    relatedPapers: [
      {
        id: "DOI-67890",
        title: "Advancements in Retrieval Systems for LLMs",
        authors: ["Author C"],
        year: 2023,
        abstract: "Focuses on the retrieval component of RAG and recent advancements in vector databases and indexing strategies.",
        parentId: "DOI-12345",
        relation: {
          type: "similarity",
          score: 0.85
        }
      },
      {
        id: "DOI-13579",
        title: "A Study on Language Model Hallucination",
        authors: ["Author D", "Author E"],
        year: 2022,
        abstract: "This paper was cited by the central paper for its foundational work on identifying and mitigating LLM hallucination.",
        parentId: "DOI-12345",
        relation: {
          type: "citation",
          score: 0.92
        }
      },
      {
        id: "DOI-24680",
        title: "Generative AI in Practice: A Case Study",
        authors: ["Author F"],
        year: 2023,
        abstract: "A practical application of generative models, sharing similar keywords and concepts with the central paper.",
        parentId: "DOI-67890",
        relation: {
          type: "similarity",
          score: 0.78
        }
      },
      {
        id: "DOI-97531",
        title: "The Economics of Large Language Models",
        authors: ["Author G", "Author H"],
        year: 2024,
        abstract: "An analysis of the economic impact, citing the central paper's work on RAG as a cost-effective solution.",
        parentId: "DOI-13579",
        relation: {
          type: "citation",
          score: 0.88
        }
      }
    ,
      // additional mock nodes (30 more)
      // Create tighter clusters by attaching most nodes to a few hubs with higher scores
      ...Array.from({ length: 30 }).map((_, idx) => {
        const i = idx + 1;
        const id = `DOI-MOCK-${10000 + i}`;
        const isCitation = i % 3 === 0;
        // Use a few hubs: 60% attach to DOI-67890, 25% to DOI-13579, rest form short chains
        const parentId = i <= 18
          ? "DOI-67890"
          : i <= 25
          ? "DOI-13579"
          : (i === 26 ? "DOI-24680" : `DOI-MOCK-${10000 + (i - 1)}`);
        // Higher similarity scores for cohesion
        const base = parentId === "DOI-67890" ? 0.82 : parentId === "DOI-13579" ? 0.8 : 0.76;
        const jitter = ((i % 5) * 0.02);
        const score = Math.min(0.95, Number((base + jitter).toFixed(2)));
        return {
          id,
          title: `Mock Paper ${i}: ${parentId} cluster`,
          authors: [
            `Author ${String.fromCharCode(65 + (i % 26))}`,
            ...(i % 3 === 0 ? [`Author ${String.fromCharCode(66 + (i % 26))}`] : [])
          ],
          year: 2015 + (i % 10),
          abstract: `Clustered mock abstract ${i}, focusing on RAG cluster dynamics and proximity.`,
          parentId,
          relation: {
            type: isCitation ? 'citation' : 'similarity',
            score: score > 0.95 ? 0.95 : score
          }
        };
      })
    ]
  };