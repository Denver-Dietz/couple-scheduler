"""
Text enhancement module using LanguageTool (picky mode) + local NLP processing.
Handles grammar, spelling, punctuation, sentence structure, and readability.
No Gemini/LLM dependency — runs entirely on LanguageTool's free API + Python logic.
"""
import re
import logging
import httpx

logger = logging.getLogger(__name__)

# Conjunctions and transition words where run-on sentences can be split
SPLIT_CONJUNCTIONS = r'\b(and|but|so|because|however|although|though|while|whereas|moreover|furthermore|also|then|yet|still|nevertheless|meanwhile|otherwise|therefore|consequently|additionally|besides)\b'

# Maximum comfortable sentence length before we consider splitting
MAX_SENTENCE_WORDS = 35

# Common misspellings and context-dependent errors that rule-based checkers miss.
# These are whole-word replacements (case-insensitive matching, preserving case).
COMMON_FIXES = {
    'realy': 'really', 'reall': 'really', 'definately': 'definitely',
    'definatly': 'definitely', 'seperate': 'separate', 'occured': 'occurred',
    'recieve': 'receive', 'untill': 'until', 'wich': 'which',
    'becuase': 'because', 'beleive': 'believe', 'freind': 'friend',
    'goverment': 'government', 'occassion': 'occasion', 'wierd': 'weird',
    'acheive': 'achieve', 'accomodate': 'accommodate', 'tommorrow': 'tomorrow',
    'tommorow': 'tomorrow', 'tomorow': 'tomorrow', 'tomarrow': 'tomorrow',
    'probly': 'probably', 'prolly': 'probably', 'didnt': "didn't",
    'doesnt': "doesn't", 'dont': "don't", 'cant': "can't", 'wont': "won't",
    'isnt': "isn't", 'wasnt': "wasn't", 'werent': "weren't", 'hasnt': "hasn't",
    'havent': "haven't", 'hadnt': "hadn't", 'shouldnt': "shouldn't",
    'couldnt': "couldn't", 'wouldnt': "wouldn't", 'thats': "that's",
    'whats': "what's", 'heres': "here's", 'theres': "there's",
    'theyre': "they're", 'youre': "you're", 'were': "we're",
    'its': "it's",  # risky but in journal context usually correct
    'im': "I'm", 'ive': "I've", 'id': "I'd", 'ill': "I'll",
    'alot': 'a lot', 'noone': 'no one', 'eachother': 'each other',
    'everytime': 'every time', 'infact': 'in fact', 'infront': 'in front',
    'alright': 'all right', 'thankyou': 'thank you',
    'gotta': 'got to', 'wanna': 'want to', 'gonna': 'going to',
    'kinda': 'kind of', 'sorta': 'sort of', 'dunno': "don't know",
    'tho': 'though', 'thru': 'through', 'nite': 'night',
    'lite': 'light', 'tonite': 'tonight', 'enuf': 'enough',
    'gud': 'good', 'cuz': 'because', 'bcuz': 'because',
    'ppl': 'people', 'rn': 'right now', 'ngl': 'not going to lie',
    'tbh': 'to be honest', 'imo': 'in my opinion',
    'evrything': 'everything', 'evry': 'every', 'evn': 'even',
    'famly': 'family', 'grate': 'great', 'sum': 'some',
    'stoer': 'store', 'todya': 'today', 'teh': 'the',
    'hte': 'the', 'adn': 'and', 'ahve': 'have', 'jsut': 'just',
    'waht': 'what', 'taht': 'that', 'wiht': 'with', 'htis': 'this',
    'doig': 'doing', 'verson': 'version', 'becasue': 'because',
    'becase': 'because', 'intresting': 'interesting', 'diffrent': 'different',
    'excercise': 'exercise', 'strenght': 'strength', 'lenght': 'length',
}


async def enhance_text(text: str) -> str:
    """
    Full text enhancement pipeline integrating local logic and LanguageTool.
    
    Why:
    - This tiered approach is used to ensure privacy and low latency without relying on expensive LLMs.
      It first patches known slang/shorthand locally, relies on LanguageTool for structural grammar,
      and finally polishes formatting, avoiding API rate limits and high token costs.
    """
    # Step 1: Local spelling fixes (catches what LanguageTool misses)
    pre_fixed = _local_spelling_fix(text)
    
    # Step 2: LanguageTool corrections
    corrected = await _languagetool_correct(pre_fixed)
    
    # Step 3: Structural improvements
    structured = _improve_structure(corrected)
    
    # Step 4: Final cleanup
    polished = _final_polish(structured)
    
    return polished


def _local_spelling_fix(text: str) -> str:
    """
    Apply common misspelling and internet-slang fixes with whole-word matching.
    
    Why:
    - LanguageTool often fails on heavy internet shorthand (e.g. 'rn', 'ngl') or misses context.
      We pre-process these known edge cases locally to ensure the downstream grammar engine
      has a cleaner base to work with.
    """
    def replace_word(match):
        word = match.group(0)
        lower = word.lower()
        if lower in COMMON_FIXES:
            replacement = COMMON_FIXES[lower]
            # Preserve original capitalization pattern
            if word[0].isupper() and replacement[0].islower():
                replacement = replacement[0].upper() + replacement[1:]
            return replacement
        return word
    
    # Build a single regex pattern for all known misspellings
    pattern = r'\b(' + '|'.join(re.escape(w) for w in COMMON_FIXES.keys()) + r')\b'
    return re.sub(pattern, replace_word, text, flags=re.IGNORECASE)


async def _languagetool_correct(text: str) -> str:
    """Run LanguageTool in picky mode with style rules enabled."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "https://api.languagetool.org/v2/check",
                data={
                    "text": text,
                    "language": "en-US",
                    "enabledOnly": "false",
                    "level": "picky",
                }
            )
            response.raise_for_status()
            data = response.json()
        
        corrected = text
        matches = sorted(data.get("matches", []), key=lambda m: m["offset"], reverse=True)
        
        for match in matches:
            replacements = match.get("replacements", [])
            if replacements:
                offset = match["offset"]
                length = match["length"]
                best = replacements[0]["value"]
                corrected = corrected[:offset] + best + corrected[offset + length:]
        
        return corrected
    except Exception as e:
        logger.warning(f"LanguageTool failed, returning original: {e}")
        return text


def _improve_structure(text: str) -> str:
    """Split run-on sentences and improve paragraph structure."""
    paragraphs = text.split('\n')
    improved = []
    for para in paragraphs:
        if not para.strip():
            improved.append(para)
            continue
        improved.append(_split_run_ons(para.strip()))
    return '\n'.join(improved)


def _split_run_ons(text: str) -> str:
    """
    Multi-phase run-on sentence splitter.
    
    Phase 1: Split at strong conjunction + subject boundaries
             (but I, also my, yet I, still they, plus the)
    Phase 2: Split at bare subject-verb boundaries with no conjunction
             (write I get, make I think — where a new thought starts)
    Phase 3: Split at "and" + subject when a chunk is still long
    
    Each phase uses lookahead so the conjunction/subject stays with 
    the next sentence fragment.
    """
    def _merge_short_fragments(fragments, min_words=4):
        merged = []
        for frag in fragments:
            if not merged:
                merged.append(frag)
            elif len(frag.split()) < min_words:
                merged[-1] = merged[-1] + ' ' + frag
            elif len(merged[-1].split()) < min_words:
                merged[-1] = merged[-1] + ' ' + frag
            else:
                merged.append(frag)
        return merged

    SUBJECT = r"(?:I(?:'[mvedl]{1,2})?|we(?:'[rved]{1,2})?|he|she|they(?:'[rved]{1,2})?|it(?:'s)?|my|this|that|the|our|you(?:'[rved]{1,2})?|your)"
    
    # --- Phase 1: Strong boundaries (always split here) ---
    strong_pattern = rf',?\s+(?=(?:but|also|yet|still|plus|however|moreover|furthermore|meanwhile|nevertheless|therefore|consequently)\s+{SUBJECT}\b)'
    parts = re.split(strong_pattern, text, flags=re.IGNORECASE)
    parts = [p.strip() for p in parts if p and p.strip()]
    
    # --- Phase 2: Bare subject-verb boundaries (no conjunction) ---
    THOUGHT_VERBS = r"(?:get|think|hope|feel|know|believe|want|need|wish|guess|mean|just|also|really|am|was|have|had|will|would|could|should|might|can|don't|didn't|can't|couldn't|wouldn't|shouldn't)"
    NEG_LB = r"(?<!\band)(?<!\bbut)(?<!\bso)(?<!\bbecause)(?<!\bor)(?<!\bwhat)(?<!\bthat)(?<!\bwhich)(?<!\bwho)(?<!\bif)(?<!\bwhen)(?<!\bwhere)(?<!\bwhy)(?<!\bhow)(?<!\bthan)(?<!\bas)(?<!\bwhile)(?<!\bthough)(?<!\balthough)"
    bare_pattern = rf'(?<=[a-z,]){NEG_LB}\s+(?=(?:I|we|he|she|they)\s+{THOUGHT_VERBS}\b)'
    
    phase2 = []
    for part in parts:
        if len(part.split()) > 15:
            sub = re.split(bare_pattern, part)
            sub = [s.strip() for s in sub if s and s.strip()]
            sub = _merge_short_fragments(sub)
            phase2.extend(sub)
        else:
            phase2.append(part)
    
    # --- Phase 3: "and" + subject (only for long chunks) ---
    phase3 = []
    for part in phase2:
        if len(part.split()) > 20:
            and_pattern = rf',?\s+(?=and\s+{SUBJECT}\b)'
            sub = re.split(and_pattern, part, flags=re.IGNORECASE)
            sub = [s.strip() for s in sub if s and s.strip()]
            sub = _merge_short_fragments(sub)
            phase3.extend(sub)
        else:
            phase3.append(part)
    
    # --- Clean up each sentence ---
    TRANSITION_WORDS = {'also', 'however', 'moreover', 'furthermore', 'meanwhile', 
                        'nevertheless', 'therefore', 'consequently', 'additionally',
                        'otherwise', 'still', 'plus'}
    
    result = []
    for s in phase3:
        s = s.strip()
        if not s:
            continue
        
        # Strip leading comma if present
        s = s.lstrip(',').strip()
        
        # Capitalize first letter
        if s and s[0].islower():
            s = s[0].upper() + s[1:]
        
        # Add comma after transition words at sentence start
        first_word = s.split()[0].rstrip(',') if s.split() else ''
        if first_word.lower() in TRANSITION_WORDS and ',' not in s[:len(first_word)+2]:
            s = first_word + ', ' + s[len(first_word):].lstrip()
        
        # Ensure ends with period
        if s and s[-1] not in '.!?':
            s += '.'
        
        result.append(s)
    
    return ' '.join(result)


def _final_polish(text: str) -> str:
    """Final cleanup pass for capitalization, spacing, and formatting."""
    # Ensure sentences start with capital letters
    text = re.sub(r'(?<=[.!?])\s+([a-z])', lambda m: m.group(0)[:-1] + m.group(1).upper(), text)
    
    # Capitalize first character of the text
    if text and text[0].islower():
        text = text[0].upper() + text[1:]
    
    # Fix double spaces
    text = re.sub(r'  +', ' ', text)
    
    # Fix space before punctuation
    text = re.sub(r'\s+([.!?,;:])', r'\1', text)
    
    # Ensure space after punctuation (except at end)
    text = re.sub(r'([.!?,;:])([A-Za-z])', r'\1 \2', text)
    
    # Fix multiple periods
    text = re.sub(r'\.{2,}', '.', text)
    
    # Capitalize 'i' when used as pronoun
    text = re.sub(r'\bi\b', 'I', text)
    
    # Trim trailing/leading whitespace per line
    lines = text.split('\n')
    text = '\n'.join(line.strip() for line in lines)
    
    return text.strip()
