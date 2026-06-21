import os
import shutil
import re
import json
import pypdf
import sys

# Ensure UTF-8 stdout encoding
sys.stdout.reconfigure(encoding='utf-8')

workspace_dir = r"c:\Users\USER\Downloads\java8-practice"
src_materials = r"C:\Users\USER\Downloads\Materials"
dest_materials = os.path.join(workspace_dir, "materials")

# 1. Copy Materials folder
print("Copying Materials folder to workspace...")
try:
    shutil.copytree(src_materials, dest_materials, dirs_exist_ok=True)
    print("Materials copied successfully.")
except Exception as e:
    print(f"Error copying materials: {e}")

# Modules configuration
modules = [
    {"dir": "Module 0 - Revision Notes for all exp candidates (Optional)", "name": "Module 0: Revision Notes", "id": "m0"},
    {"dir": "Module 1 - [0-3] Yrs Exp", "name": "Module 1: [0-3] Yrs Exp", "id": "m1"},
    {"dir": "Module 2 - [3-5] Yrs Exp", "name": "Module 2: [3-5] Yrs Exp", "id": "m2"},
    {"dir": "Module 3 - [5-8] Yrs Exp", "name": "Module 3: [5-8] Yrs Exp", "id": "m3"},
    {"dir": "Module 4 - [8-15] Yrs Exp", "name": "Module 4: [8-15] Yrs Exp", "id": "m4"},
    {"dir": "Bonus - Resume Tips and Templates", "name": "Bonus: Resume & Career", "id": "bonus"}
]

def clean_text_lines(text):
    lines = text.split('\n')
    cleaned = []
    for line in lines:
        l = line.strip()
        if not l:
            continue
        # Skip header/footer noise
        if "GenZ Career" in l or "Subscribe for Interview" in l or "Interview Preparation" in l or "Most Asked" in l or "Follow on YouTube" in l:
            continue
        cleaned.append(line) # Keep spaces for indent formatting
    return "\n".join(cleaned)

def parse_qa_pdf(filepath):
    try:
        reader = pypdf.PdfReader(filepath)
        full_text = ""
        for page in reader.pages:
            full_text += page.extract_text() or ""
        
        text = clean_text_lines(full_text)
        
        # Regex for Q1., Q #1), 1., etc.
        q_pattern = re.compile(r'(?:^|\n)(Q\d+\.|Q\s*#\d+\)|Q\d+\)|Question\s*\d+\.|[1-9]\d*\.)\s*(.*?)(?=\n(?:Q\d+\.|Q\s*#\d+\)|Q\d+\)|Question\s*\d+\.|[1-9]\d*\.)|\Z)', re.DOTALL)
        matches = q_pattern.findall(text)
        
        items = []
        if matches:
            for prefix, body in matches:
                body = body.strip()
                # Find if there is a '?' to split question from answer
                if '?' in body:
                    idx = body.find('?')
                    q_text = body[:idx+1].replace('\n', ' ').strip()
                    a_text = body[idx+1:].strip()
                else:
                    parts = body.split('\n', 1)
                    q_text = parts[0].strip()
                    a_text = parts[1].strip() if len(parts) > 1 else ""
                
                items.append({
                    "q": f"{prefix} {q_text}",
                    "a": a_text
                })
        else:
            # Fallback split for unnumbered questions (e.g. Spring, Microservices)
            # Find lines that look like questions (starting with uppercase word, ending with ?, not too long)
            parts = re.split(r'\n(?=[A-Z][a-zA-Z\s,]{3,70}\?)', text)
            for part in parts:
                part = part.strip()
                if not part:
                    continue
                lines = part.split('\n')
                if len(lines) > 1:
                    q_text = lines[0].strip()
                    a_text = "\n".join(lines[1:]).strip()
                    items.append({
                        "q": q_text,
                        "a": a_text
                    })
                else:
                    items.append({
                        "q": "Key Concept",
                        "a": part
                    })
        return items
    except Exception as e:
        print(f"Error parsing Q&A {filepath}: {e}")
        return []

def parse_coding_pdf(filepath):
    try:
        reader = pypdf.PdfReader(filepath)
        full_text = ""
        for page in reader.pages:
            full_text += page.extract_text() or ""
            
        text = clean_text_lines(full_text)
        
        # Match pattern: (Q\s*#\d+\)|[1-9]\d*\.) followed by title/body
        pattern = re.compile(r'(?:^|\n)(Q\s*#\d+\)|[1-9]\d*\.)\s*(.*?)(?=\n(?:Q\s*#\d+\)|[1-9]\d*\.)|\Z)', re.DOTALL)
        matches = pattern.findall(text)
        
        items = []
        for prefix, body in matches:
            body = body.strip()
            # Split body into problem, solution, explanation
            problem = ""
            solution = ""
            explanation = ""
            
            if "Answer:" in body:
                parts = body.split("Answer:", 1)
                problem = parts[0].strip()
                answer_part = parts[1].strip()
                if "Explanation:" in answer_part:
                    aparts = answer_part.split("Explanation:", 1)
                    solution = aparts[0].strip()
                    explanation = aparts[1].strip()
                else:
                    solution = answer_part
            elif "Solution:" in body:
                parts = body.split("Solution:", 1)
                problem_part = parts[0].strip()
                solution_part = parts[1].strip()
                
                if "Problem:" in problem_part:
                    problem = problem_part.replace("Problem:", "").strip()
                else:
                    problem = problem_part
                    
                if "Explanation:" in solution_part:
                    sparts = solution_part.split("Explanation:", 1)
                    solution = sparts[0].strip()
                    explanation = sparts[1].strip()
                else:
                    solution = solution_part
            else:
                # General fallback: check if we have code-like text or just split
                lines = body.split('\n')
                problem = lines[0]
                solution = "\n".join(lines[1:])
            
            title = problem.split('\n')[0] if '\n' in problem else problem
            title = title.replace("Problem:", "").strip()
            
            items.append({
                "id": prefix.strip(),
                "title": title,
                "problem": problem,
                "solution": solution,
                "explanation": explanation
            })
        return items
    except Exception as e:
        print(f"Error parsing Coding {filepath}: {e}")
        return []

def get_human_title(filename):
    title = filename.replace('.pdf', '')
    title = title.replace('-', ' ')
    
    # Custom titles cleanup
    title = title.replace('Level I', 'Level I')
    title = title.replace('Level II', 'Level II')
    title = title.replace('Level III', 'Level III')
    title = title.replace('Level IV', 'Level IV')
    title = title.replace('Level V', 'Level V')
    
    # Capitalize words
    words = title.split()
    cap_words = []
    for w in words:
        if w.lower() in ['and', 'for', 'in', 'of', 'on', 'with', 'at', 'to', 'a', 'an', 'the', 'is']:
            cap_words.append(w.lower())
        elif w.upper() in ['SQL', 'J8', 'JDK', 'JRE', 'JVM', 'MVC', 'JPA', 'DB', 'API', 'REST', 'IOC', 'AOP', 'JSON']:
            cap_words.append(w.upper())
        elif w.lower() == 'junit':
            cap_words.append('JUnit')
        else:
            cap_words.append(w.capitalize())
            
    # Always capitalize first and last word
    if cap_words:
        cap_words[0] = cap_words[0].capitalize()
        cap_words[-1] = cap_words[-1].capitalize()
        
    return " ".join(cap_words)

# Initialize output structure
database = {}

for m in modules:
    module_dir = os.path.join(dest_materials, m["dir"])
    database[m["id"]] = {
        "name": m["name"],
        "steps": []
    }
    
    if not os.path.exists(module_dir):
        print(f"Directory not found: {module_dir}")
        continue
        
    # Sort files naturally (so Step 1 is before Step 2, and Step 9 before Step 10)
    def natural_sort_key(s):
        return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', s)]
        
    files = sorted([f for f in os.listdir(module_dir) if f.endswith(".pdf")], key=natural_sort_key)
    
    for filename in files:
        filepath = os.path.join(module_dir, filename)
        step_title = get_human_title(filename)
        pages_count = 0
        try:
            reader = pypdf.PdfReader(filepath)
            pages_count = len(reader.pages)
        except Exception:
            pass
            
        file_size_kb = os.path.getsize(filepath) // 1024
        
        # Determine step type
        # Module 0 files are revision references
        if m["id"] == "m0":
            database[m["id"]]["steps"].append({
                "title": step_title,
                "filename": filename,
                "pages": pages_count,
                "size_kb": file_size_kb,
                "type": "reference",
                "rel_path": f"materials/{m['dir']}/{filename}",
                "items": []
            })
            print(f"Added reference note: {step_title}")
        # Bonus file is resume
        elif m["id"] == "bonus":
            database[m["id"]]["steps"].append({
                "title": step_title,
                "filename": filename,
                "pages": pages_count,
                "size_kb": file_size_kb,
                "type": "resume",
                "rel_path": f"materials/{m['dir']}/{filename}",
                "items": []
            })
            print(f"Added resume guide: {step_title}")
        # Modules 1-4 are interactive Q&A or Coding
        else:
            is_coding = bool(re.search(r'(coding|stream-api)', filename, re.IGNORECASE))
            step_type = "coding" if is_coding else "qa"
            
            print(f"Parsing interactive {step_type}: {step_title}...")
            if is_coding:
                parsed_items = parse_coding_pdf(filepath)
            else:
                parsed_items = parse_qa_pdf(filepath)
                
            database[m["id"]]["steps"].append({
                "title": step_title,
                "filename": filename,
                "pages": pages_count,
                "size_kb": file_size_kb,
                "type": step_type,
                "rel_path": f"materials/{m['dir']}/{filename}",
                "items": parsed_items
            })
            print(f"Parsed {len(parsed_items)} items for {step_title}")

# Write to materials_data.js
output_js_path = os.path.join(workspace_dir, "materials_data.js")
print(f"Writing database to {output_js_path}...")
try:
    with open(output_js_path, "w", encoding="utf-8") as f:
        f.write("// Interactive Materials Database\n")
        f.write("const materialsData = ")
        json.dump(database, f, indent=2, ensure_ascii=False)
        f.write(";\n")
    print("Database written successfully!")
except Exception as e:
    print(f"Error writing JS database: {e}")

print("All done!")
