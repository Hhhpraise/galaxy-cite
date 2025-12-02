import numpy as np
from typing import Dict, List, Any
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import DBSCAN
import networkx as nx
import json


class SimilarityEngine:
    def __init__(self, model_name='all-MiniLM-L6-v2'):
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(model_name)
        except ImportError:
            print("SentenceTransformers not available. Using dummy embeddings.")
            self.model = None

    def compute_embeddings(self, papers: Dict[str, Any]) -> Dict[str, np.ndarray]:
        """Compute embeddings for all papers"""
        if self.model is None:
            # Return random embeddings if model not available
            embeddings = {}
            for paper_id, paper in papers.items():
                embedding = np.random.randn(384)  # Same dimension as MiniLM
                paper.embedding = embedding.tolist()
                embeddings[paper_id] = embedding
            return embeddings

        texts = []
        paper_ids = []

        for paper_id, paper in papers.items():
            text = f"{paper.title}. {paper.abstract}"
            texts.append(text)
            paper_ids.append(paper_id)

        # Compute embeddings in batches
        if texts:
            embeddings = self.model.encode(texts, show_progress_bar=False)
        else:
            embeddings = np.array([])

        # Store embeddings in papers
        for i, paper_id in enumerate(paper_ids):
            if i < len(embeddings):
                papers[paper_id].embedding = embeddings[i].tolist()

        return {pid: emb for pid, emb in zip(paper_ids, embeddings) if emb is not None}

    def enhance_with_similarity(self, network: Dict, top_k: int = 10) -> Dict:
        """Add similarity edges to the network"""
        papers = network["papers"]
        edges = network["edges"]

        if not papers:
            return network

        # Compute embeddings if not already computed
        embeddings_dict = self.compute_embeddings(papers)

        if embeddings_dict:
            paper_ids = list(embeddings_dict.keys())
            embeddings = np.array([embeddings_dict[pid] for pid in paper_ids])

            # Compute similarity matrix
            similarity_matrix = cosine_similarity(embeddings)

            # Add similarity edges
            for i, pid1 in enumerate(paper_ids):
                # Get top_k most similar papers (excluding itself)
                similarities = similarity_matrix[i]
                # Get indices sorted by similarity (descending)
                similar_indices = np.argsort(similarities)[::-1]
                # Skip the first one (itself) and take next top_k
                similar_indices = similar_indices[1:top_k + 1]

                for j in similar_indices:
                    pid2 = paper_ids[j]
                    similarity = similarities[j]

                    # Only add edge if similarity > threshold
                    if similarity > 0.3:  # Lower threshold for demo
                        # Check if edge already exists
                        edge_exists = any(
                            (e["source"] == pid1 and e["target"] == pid2) or
                            (e["source"] == pid2 and e["target"] == pid1)
                            for e in edges
                        )

                        if not edge_exists:
                            edges.append({
                                "source": pid1,
                                "target": pid2,
                                "type": "similar",
                                "strength": float(similarity)
                            })

            # Perform clustering if we have enough papers
            if len(paper_ids) > 2:
                try:
                    clusters = self.cluster_papers(embeddings)
                    for i, pid in enumerate(paper_ids):
                        papers[pid].cluster = int(clusters[i])
                except:
                    # If clustering fails, assign all to cluster 0
                    for pid in paper_ids:
                        papers[pid].cluster = 0

            # Compute graph centrality
            try:
                graph = self.build_graph(papers, edges)
                if len(graph.nodes()) > 0:
                    centrality = nx.degree_centrality(graph)
                    for pid, cent in centrality.items():
                        if pid in papers:
                            papers[pid].centrality = cent
            except:
                pass

        return {
            "papers": papers,
            "edges": edges,
            "central_paper": network["central_paper"],
            "stats": network["stats"]
        }

    def cluster_papers(self, embeddings: np.ndarray, eps: float = 0.5, min_samples: int = 2):
        """Cluster papers using DBSCAN"""
        clustering = DBSCAN(eps=eps, min_samples=min_samples, metric='cosine')
        return clustering.fit_predict(embeddings)

    def build_graph(self, papers: Dict, edges: List) -> nx.Graph:
        """Build NetworkX graph from papers and edges"""
        G = nx.Graph()

        # Add nodes
        for paper_id, paper in papers.items():
            G.add_node(paper_id,
                       title=paper.title,
                       year=paper.year,
                       citation_count=paper.citation_count,
                       cluster=paper.cluster)

        # Add edges
        for edge in edges:
            if edge["source"] in papers and edge["target"] in papers:
                G.add_edge(edge["source"], edge["target"],
                           weight=edge.get("strength", 1.0),
                           type=edge["type"])

        return G