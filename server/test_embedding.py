from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")

text = "I am losing consistency again"

embedding = model.encode(text)

print("Embedding length:", len(embedding))
print("First 10 values:", embedding[:10])