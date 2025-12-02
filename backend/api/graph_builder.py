import numpy as np
from typing import Dict, List, Any
import math
import random


class GraphBuilder:
    def __init__(self):
        pass

    def build_galaxy_structure(self, network: Dict, layout: str = "spherical", central_paper_id: str = None) -> Dict:
        """Convert network to galaxy visualization structure"""
        papers = network["papers"]
        edges = network["edges"]

        if not papers:
            return {"nodes": [], "links": [], "layout": layout}

        # Create nodes
        nodes = []
        paper_id_to_index = {}

        for i, (paper_id, paper) in enumerate(papers.items()):
            paper_id_to_index[paper_id] = i

            # Calculate node properties
            if layout == "spherical":
                position = self._spherical_layout(i, len(papers))
            elif layout == "force_directed":
                position = self._force_directed_layout(i, len(papers))
            else:  # temporal
                position = self._temporal_layout(paper, i, len(papers))

            nodes.append({
                "id": paper_id,
                "name": paper.title[:100],  # Limit title length
                "title": paper.title,
                "authors": paper.authors[:5],  # First 5 authors
                "year": paper.year,
                "citation_count": paper.citation_count,
                "abstract": paper.abstract[:500] if paper.abstract else "",  # Limit abstract
                "url": paper.url,
                "doi": paper.doi,
                "arxiv_id": paper.arxiv_id,
                "fields": paper.fields,
                "cluster": paper.cluster,
                "centrality": paper.centrality,
                "x": float(position[0]),
                "y": float(position[1]),
                "z": float(position[2]),
                "size": self._calculate_size(paper),
                "color": self._get_color(paper)
            })

        # Create links
        links = []
        for edge in edges:
            source_idx = paper_id_to_index.get(edge["source"])
            target_idx = paper_id_to_index.get(edge["target"])

            if source_idx is not None and target_idx is not None:
                links.append({
                    "source": source_idx,
                    "target": target_idx,
                    "type": edge["type"],
                    "strength": edge.get("strength", 1.0)
                })

        # Mark central paper
        if central_paper_id and central_paper_id in paper_id_to_index:
            central_idx = paper_id_to_index[central_paper_id]
            nodes[central_idx]["isCentral"] = True
            nodes[central_idx]["size"] = nodes[central_idx]["size"] * 1.5

        return {
            "nodes": nodes,
            "links": links,
            "layout": layout,
            "metadata": {
                "node_count": len(nodes),
                "link_count": len(links),
                "clusters": len(set(node["cluster"] for node in nodes))
            }
        }

    def _spherical_layout(self, index: int, total: int, radius: float = 10.0) -> tuple:
        """Arrange nodes in a spherical layout"""
        if total == 1:
            return (0, 0, 0)

        # Use Fibonacci sphere for even distribution
        offset = 2.0 / total
        increment = math.pi * (3.0 - math.sqrt(5.0))

        y = ((index * offset) - 1) + (offset / 2)
        r = math.sqrt(1 - y * y)

        phi = (index % total) * increment

        x = math.cos(phi) * r
        z = math.sin(phi) * r

        return (x * radius, y * radius, z * radius)

    def _force_directed_layout(self, index: int, total: int) -> tuple:
        """Simple force-directed layout coordinates"""
        if total == 1:
            return (0, 0, 0)

        # Distribute in a cube
        side = int(math.ceil(total ** (1 / 3)))
        x = (index % side) - side / 2
        y = ((index // side) % side) - side / 2
        z = (index // (side * side)) - side / 2

        # Add some randomness
        x += random.uniform(-0.5, 0.5)
        y += random.uniform(-0.5, 0.5)
        z += random.uniform(-0.5, 0.5)

        return (x, y, z)

    def _temporal_layout(self, paper: Any, index: int, total: int) -> tuple:
        """Arrange by publication year"""
        current_year = 2024
        min_year = 1900

        if paper.year > 0:
            # Normalize year to range [-5, 5]
            normalized_year = (paper.year - min_year) / (current_year - min_year)
            x = (normalized_year * 10) - 5
        else:
            x = random.uniform(-5, 5)

        # Distribute y and z in a circle
        angle = (index / total) * 2 * math.pi
        y = math.cos(angle) * 3
        z = math.sin(angle) * 3

        return (x, y, z)

    def _calculate_size(self, paper: Any) -> float:
        """Calculate node size based on citation count"""
        if paper.citation_count <= 0:
            return 1.0

        # Logarithmic scaling
        size = math.log10(paper.citation_count + 1) * 0.5 + 1.0
        return min(size, 5.0)  # Cap at 5.0

    def _get_color(self, paper: Any) -> str:
        """Get color based on field or cluster"""
        # Color mapping for fields
        field_colors = {
            "Computer Science": "#4285F4",
            "Artificial Intelligence": "#EA4335",
            "Machine Learning": "#FBBC05",
            "Mathematics": "#34A853",
            "Physics": "#8B5CF6",
            "Biology": "#10B981",
            "Chemistry": "#F59E0B",
            "Medicine": "#EF4444",
            "Engineering": "#6366F1"
        }

        if paper.fields:
            for field in paper.fields:
                if field in field_colors:
                    return field_colors[field]

        # If no field match, use cluster-based colors
        cluster_colors = [
            "#FF6B6B", "#4ECDC4", "#FFD166", "#06D6A0",
            "#118AB2", "#EF476F", "#073B4C", "#7209B7"
        ]

        cluster_idx = abs(paper.cluster) % len(cluster_colors)
        return cluster_colors[cluster_idx]