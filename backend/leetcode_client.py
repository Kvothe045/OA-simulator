import httpx

async def get_leetcode_details(slug: str):
    url = "https://leetcode.com/graphql"
    query = """
    query getQuestionDetails($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        title
        difficulty
        content
        sampleTestCase
        codeSnippets {
          lang
          langSlug
          code
        }
      }
    }
    """
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json={"query": query, "variables": {"titleSlug": slug}})
        data = resp.json().get("data", {}).get("question")
        
        if not data:
            return None
            
        snippets = data.get("codeSnippets") or []
        fallback_code = (
            "// ⚠️ Starter code not available.\n"
            "// This is likely a LeetCode Premium question.\n"
            "class Solution {\npublic:\n    \n};"
        )
        cpp_code = next((s["code"] for s in snippets if s["langSlug"] == "cpp"), fallback_code)
        
        fallback_content = (
            "<div style='color: #ef4444; padding: 1rem; border: 1px solid #ef4444; border-radius: 0.5rem;'>"
            "<strong>⚠️ Premium Content Restricted</strong><br/>"
            "LeetCode hides the description for this question."
            "</div>"
        )
        
        return {
            "questionId": data.get("questionId"), # <--- ADDED THIS
            "title": data.get("title") or "Unknown Title",
            "difficulty": data.get("difficulty") or "Unknown",
            "content": data.get("content") or fallback_content,
            "sample_input": data.get("sampleTestCase") or "",
            "starter_code": cpp_code
        }