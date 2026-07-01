import fitz
import httpx
from bs4 import BeautifulSoup

def extract_from_pdf(filepath: str) -> str:
    page_text_list =[] 
    document = fitz.open(filepath)
    #document is a list of pages and each page text has to be extracted

    for page in document:
        text = page.get_text()
        if text == "":
            continue
        else:
            page_text_list.append(text)
    
    return "\n\n".join(page_text_list)

def extract_from_url(url: str)-> str:
    """
    Fetch a webpage and extract text from <p> tags only
    """
    response = httpx.get(
        url,
        follow_redirects=True,
        timeout=30.0
    )
    response.raise_for_status()

    soup= BeautifulSoup(response.text, "html.parser")

    paragraphs = soup.find_all("p")

    text_parts = []

    for p in paragraphs:
        text = p.get_text(strip=True)
        if text:
            text_parts.append(text)
    
    return "\n\n".join(text_parts)


def extract_from_text(raw_text: str) -> str:
    """
    A passthrough fuction that validates that the text passed is a non-empty string and then return it
    """
    if raw_text != "":
        return raw_text
    else:
        return "<Empty string passed>"
    




