import asyncio
import aiohttp
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import re
import xml.etree.ElementTree as ET
import json


@dataclass
class Paper:
    id: str
    title: str
    abstract: str
    authors: List[str]
    year: int
    citation_count: int
    references: List[str]
    citations: List[str]
    url: Optional[str] = None
    doi: Optional[str] = None
    arxiv_id: Optional[str] = None
    fields: List[str] = None
    embedding: Optional[List[float]] = None
    cluster: int = 0
    centrality: float = 0.0

    def __post_init__(self):
        if self.fields is None:
            self.fields = []


class PaperAnalyzer:
    def __init__(self):
        self.semantic_scholar_base = "https://api.semanticscholar.org/graph/v1"
        self.crossref_base = "https://api.crossref.org/works"
        self.arxiv_base = "https://export.arxiv.org/api/query"
        self.session: Optional[aiohttp.ClientSession] = None

    async def init_session(self):
        if not self.session:
            self.session = aiohttp.ClientSession()

    async def close_session(self):
        if self.session:
            await self.session.close()

    async def fetch_paper(self, identifier: str, source: str) -> Paper:
        """Fetch paper from various sources"""
        await self.init_session()

        if source == "doi":
            return await self._fetch_from_doi(identifier)
        elif source == "arxiv":
            return await self._fetch_from_arxiv(identifier)
        elif source == "title":
            return await self._search_by_title(identifier)
        else:
            raise ValueError(f"Unknown source: {source}")

    async def _fetch_from_doi(self, doi: str) -> Paper:
        """Fetch paper using DOI"""
        # Clean DOI
        clean_doi = doi.strip()
        if clean_doi.startswith("http"):
            clean_doi = clean_doi.split("doi.org/")[-1]

        # Try Semantic Scholar first
        url = f"{self.semantic_scholar_base}/paper/DOI:{clean_doi}"
        params = {
            "fields": "paperId,title,abstract,authors,year,citationCount,references,citations,url,fieldsOfStudy,externalIds"
        }

        async with self.session.get(url, params=params) as response:
            if response.status == 200:
                data = await response.json()
                return self._parse_semantic_scholar(data)

        # Fallback to Crossref
        url = f"{self.crossref_base}/{clean_doi}"
        async with self.session.get(url) as response:
            if response.status == 200:
                data = await response.json()
                return self._parse_crossref(data, doi=clean_doi)

        raise ValueError(f"Paper not found for DOI: {doi}")

    async def _fetch_from_arxiv(self, arxiv_id: str) -> Paper:
        """Fetch paper from arXiv"""
        # Clean arXiv ID
        clean_id = arxiv_id.strip()
        if "arxiv.org/abs/" in clean_id:
            clean_id = clean_id.split("arxiv.org/abs/")[-1]
        elif "arxiv.org/pdf/" in clean_id:
            clean_id = clean_id.split("arxiv.org/pdf/")[-1].replace('.pdf', '')

        # Fetch from arXiv API
        url = f"{self.arxiv_base}?id_list={clean_id}"
        headers = {"User-Agent": "GalaxyCite/1.0"}

        async with self.session.get(url, headers=headers) as response:
            if response.status == 200:
                content = await response.text()
                return self._parse_arxiv_xml(content, clean_id)

        # Try Semantic Scholar as fallback
        return await self._fetch_from_doi(f"10.48550/arXiv.{clean_id}")

    async def _search_by_title(self, title: str) -> Paper:
        """Search paper by title"""
        url = f"{self.semantic_scholar_base}/paper/search"
        params = {
            "query": title,
            "limit": 1,
            "fields": "paperId,title,abstract,authors,year,citationCount,references,citations,url,fieldsOfStudy"
        }

        async with self.session.get(url, params=params) as response:
            if response.status == 200:
                data = await response.json()
                if data.get("data"):
                    return self._parse_semantic_scholar(data["data"][0])

        raise ValueError(f"No paper found for title: {title}")

    async def build_citation_network(self, seed_paper_id: str,
                                     depth: int = 2,
                                     max_papers: int = 100) -> Dict:
        """Build citation network starting from seed paper"""
        papers = {}  # paper_id -> Paper
        edges = []  # {source, target, type}
        visited = set()

        async def explore(paper_id: str, current_depth: int):
            if current_depth > depth or len(papers) >= max_papers or paper_id in visited:
                return

            visited.add(paper_id)

            try:
                # Determine source type
                source_type = "arxiv" if "arXiv" in paper_id or "arxiv" in paper_id or re.match(r'^\d+\.\d+$',
                                                                                                paper_id) else "doi"

                # Fetch paper
                paper = await self.fetch_paper(paper_id, source_type)
                papers[paper_id] = paper

                # Explore references (citations this paper makes)
                ref_tasks = []
                for ref_id in paper.references[:20]:  # Limit references
                    if ref_id and ref_id not in visited and ref_id not in papers:
                        ref_tasks.append(explore(ref_id, current_depth + 1))
                        edges.append({
                            "source": paper_id,
                            "target": ref_id,
                            "type": "cites",
                            "strength": 1.0
                        })

                # Explore citations (papers citing this one)
                citation_tasks = []
                for citation_id in paper.citations[:10]:  # Limit citations
                    if citation_id and citation_id not in visited and citation_id not in papers:
                        citation_tasks.append(explore(citation_id, current_depth + 1))
                        edges.append({
                            "source": citation_id,
                            "target": paper_id,
                            "type": "cited_by",
                            "strength": 1.0
                        })

                # Process in parallel
                if ref_tasks:
                    await asyncio.gather(*ref_tasks)
                if citation_tasks:
                    await asyncio.gather(*citation_tasks)

            except Exception as e:
                print(f"Error fetching paper {paper_id}: {e}")

        # Start exploration
        await explore(seed_paper_id, 0)

        return {
            "papers": papers,
            "edges": edges,
            "central_paper": seed_paper_id,
            "stats": {
                "total_papers": len(papers),
                "total_edges": len(edges),
                "max_depth": depth
            }
        }

    def _parse_semantic_scholar(self, data: Dict) -> Paper:
        """Parse Semantic Scholar API response"""
        authors = []
        if data.get("authors"):
            authors = [author.get("name", "") for author in data.get("authors", [])]

        return Paper(
            id=data.get("paperId", ""),
            title=data.get("title", ""),
            abstract=data.get("abstract", ""),
            authors=authors,
            year=data.get("year", 0),
            citation_count=data.get("citationCount", 0),
            references=[ref.get("paperId", "") for ref in data.get("references", []) if ref.get("paperId")],
            citations=[cite.get("paperId", "") for cite in data.get("citations", []) if cite.get("paperId")],
            url=data.get("url", ""),
            doi=data.get("externalIds", {}).get("DOI"),
            arxiv_id=data.get("externalIds", {}).get("ArXiv"),
            fields=data.get("fieldsOfStudy", []),
            embedding=None
        )

    def _parse_crossref(self, data: Dict, doi: str) -> Paper:
        """Parse Crossref API response"""
        item = data.get("message", {})
        authors = []
        if item.get("author"):
            for author in item.get("author", []):
                given = author.get("given", "")
                family = author.get("family", "")
                name = f"{given} {family}".strip()
                if name:
                    authors.append(name)

        title = ""
        if item.get("title"):
            title_list = item.get("title", [])
            if title_list:
                title = title_list[0]

        year = 0
        if item.get("published"):
            date_parts = item.get("published", {}).get("date-parts", [[0]])
            if date_parts and date_parts[0]:
                year = int(date_parts[0][0])

        return Paper(
            id=doi,
            title=title,
            abstract="",
            authors=authors,
            year=year,
            citation_count=item.get("is-referenced-by-count", 0),
            references=[],
            citations=[],
            url=item.get("URL", f"https://doi.org/{doi}"),
            doi=doi,
            arxiv_id=None,
            fields=item.get("subject", []),
            embedding=None
        )

    def _parse_arxiv_xml(self, xml_content: str, arxiv_id: str) -> Paper:
        """Parse arXiv API XML response"""
        try:
            root = ET.fromstring(xml_content)
            namespace = {'atom': 'http://www.w3.org/2005/Atom'}

            entry = root.find('atom:entry', namespace)
            if entry is None:
                raise ValueError(f"No paper found for arXiv ID: {arxiv_id}")

            title_elem = entry.find('atom:title', namespace)
            title = title_elem.text.strip() if title_elem is not None and title_elem.text else ""

            summary_elem = entry.find('atom:summary', namespace)
            abstract = summary_elem.text.strip() if summary_elem is not None and summary_elem.text else ""

            published_elem = entry.find('atom:published', namespace)
            published = published_elem.text if published_elem is not None else ""

            authors = []
            author_elems = entry.findall('atom:author', namespace)
            for author_elem in author_elems:
                name_elem = author_elem.find('atom:name', namespace)
                if name_elem is not None and name_elem.text:
                    authors.append(name_elem.text.strip())

            # Extract year from published date
            year_match = re.search(r'(\d{4})', published)
            year = int(year_match.group(1)) if year_match else 0

            # Clean title (remove arXiv prefixes)
            if title.startswith('arXiv:'):
                title = title[6:]

            return Paper(
                id=arxiv_id,
                title=title,
                abstract=abstract,
                authors=authors,
                year=year,
                citation_count=0,
                references=[],
                citations=[],
                url=f"https://arxiv.org/abs/{arxiv_id}",
                doi=None,
                arxiv_id=arxiv_id,
                fields=[],
                embedding=None
            )
        except ET.ParseError as e:
            raise ValueError(f"Failed to parse arXiv XML: {e}")