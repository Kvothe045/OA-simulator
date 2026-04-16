import json
import logging

# Configure production-level logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - [%(levelname)s] - %(message)s")

class QuestionStore:
    def __init__(self):
        self.questions: dict = {}
        self.companies: set = set()
        self.periods: set = set()
        self.difficulty_buckets: dict = {"Easy": [], "Medium": [], "Hard": []}

    def load_data(self, file_path: str):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                self.questions = json.load(f)
            
            # Reset metadata for hot-reloads
            self.companies.clear()
            self.periods.clear()
            for bucket in self.difficulty_buckets.values():
                bucket.clear()

            # O(N) pre-indexing for ultra-fast API response times
            for q_id, data in self.questions.items():
                
                # Extract companies and periods
                for comp_name, comp_data in data.get("companies", {}).items():
                    self.companies.add(comp_name)
                    if period := comp_data.get("period"):
                        self.periods.add(period)
                
                # Bucket by difficulty safely
                diff = data.get("difficulty")
                if diff in self.difficulty_buckets:
                    self.difficulty_buckets[diff].append(data)
            
            logging.info(f"Successfully loaded {len(self.questions)} questions.")
            logging.info(f"Indexed {len(self.companies)} companies and {len(self.periods)} periods.")
            
        except FileNotFoundError:
            logging.error(f"Critical: Database file {file_path} not found.")
        except json.JSONDecodeError:
            logging.error(f"Critical: Corrupted JSON data in {file_path}.")
        except Exception as e:
            logging.error(f"Critical: Failed to load data: {e}")

# Singleton instance
store = QuestionStore()