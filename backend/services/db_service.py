import os
import re
import logging
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

try:
    from pymongo import MongoClient
    from bson.objectid import ObjectId
    PYMONGO_AVAILABLE = True
except ImportError:
    PYMONGO_AVAILABLE = False
    logger.warning("PyMongo not installed. Using in-memory fallback store.")

class MongoDBService:
    def __init__(self):
        self.client = None
        self.db = None
        self.uri = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI") or "mongodb://localhost:27017/MDMDB"
        self.db_name_setting = os.getenv("MONGO_DB_NAME") or "MDMDB"
        self.connected = False
        
        self.memory_store = {
            "users": [],
            "student_profiles": [],
            "resume_analyses": [],
            "interview_experiences": [
                {
                    "_id": "exp_1",
                    "student_name": "Aarav Sharma",
                    "college": "IIT Bombay",
                    "company_name": "Google",
                    "job_role": "Software Development Engineer",
                    "placement_year": "2025 Placement",
                    "rounds_conducted": "4 Rounds",
                    "status": "Selected / Offered",
                    "summary": "3 Technical DSA rounds + 1 Googliness round. Focused heavily on Tree traversals, Graph Shortest Path, and LRU Cache design.",
                    "upvotes": 42,
                    "created_at": datetime.utcnow().isoformat()
                },
                {
                    "_id": "exp_2",
                    "student_name": "Priya Patel",
                    "college": "NIT Trichy",
                    "company_name": "Amazon",
                    "job_role": "SDE-1",
                    "placement_year": "2025 Placement",
                    "rounds_conducted": "3 Rounds",
                    "status": "Selected / Offered",
                    "summary": "Online Coding Assessment (2 questions) followed by 2 technical virtual rounds. Leadership principles are crucial for Amazon rounds!",
                    "upvotes": 38,
                    "created_at": datetime.utcnow().isoformat()
                },
                {
                    "_id": "exp_3",
                    "student_name": "Rohan Verma",
                    "college": "BITS Pilani",
                    "company_name": "TCS Digital",
                    "job_role": "System Engineer",
                    "placement_year": "2025 Placement",
                    "rounds_conducted": "2 Rounds",
                    "status": "Selected / Offered",
                    "summary": "TCS NQT National Qualifier test cleared. Technical interview focused on Python OOPs, SQL queries, and final year project architecture.",
                    "upvotes": 29,
                    "created_at": datetime.utcnow().isoformat()
                }
            ]
        }
        self._connect()

    def _connect(self):
        if not PYMONGO_AVAILABLE:
            return
        try:
            self.client = MongoClient(self.uri, serverSelectionTimeoutMS=5000)
            self.client.admin.command('ping')
            
            # Extract database name or use MONGO_DB_NAME env var
            db_name = self.db_name_setting
            if not db_name or db_name == "prepnexus_db":
                parts = self.uri.split('?')[0].split('/')
                if len(parts) > 3 and parts[-1]:
                    db_name = parts[-1]
            self.db = self.client[db_name]
            self.connected = True
            logger.info(f"Connected to MongoDB Atlas database '{db_name}' successfully.")
            
            # Auto-seed initial experiences into MongoDB if collection is empty
            if self.db.interview_experiences.count_documents({}) == 0:
                seed_data = [
                    {
                        "student_name": "Aarav Sharma",
                        "college": "IIT Bombay",
                        "company_name": "Google",
                        "job_role": "Software Development Engineer",
                        "placement_year": "2025 Placement",
                        "rounds_conducted": "4 Rounds",
                        "status": "Selected / Offered",
                        "summary": "3 Technical DSA rounds + 1 Googliness round. Focused heavily on Tree traversals, Graph Shortest Path, and LRU Cache design.",
                        "upvotes": 42,
                        "created_at": datetime.utcnow().isoformat()
                    },
                    {
                        "student_name": "Priya Patel",
                        "college": "NIT Trichy",
                        "company_name": "Amazon",
                        "job_role": "SDE-1",
                        "placement_year": "2025 Placement",
                        "rounds_conducted": "3 Rounds",
                        "status": "Selected / Offered",
                        "summary": "Online Coding Assessment (2 questions) followed by 2 technical virtual rounds. Leadership principles are crucial for Amazon rounds!",
                        "upvotes": 38,
                        "created_at": datetime.utcnow().isoformat()
                    },
                    {
                        "student_name": "Rohan Verma",
                        "college": "BITS Pilani",
                        "company_name": "TCS Digital",
                        "job_role": "System Engineer",
                        "placement_year": "2025 Placement",
                        "rounds_conducted": "2 Rounds",
                        "status": "Selected / Offered",
                        "summary": "TCS NQT National Qualifier test cleared. Technical interview focused on Python OOPs, SQL queries, and final year project architecture.",
                        "upvotes": 29,
                        "created_at": datetime.utcnow().isoformat()
                    }
                ]
                self.db.interview_experiences.insert_many(seed_data)
                logger.info("Auto-seeded initial placement interview experiences into MongoDB Atlas.")

        except Exception as e:
            logger.warning(f"MongoDB connection offline ({e}). Using in-memory repository layer.")
            self.connected = False

    # USER ACCOUNT & LOGIN LOGS METHODS (MongoDB Atlas)
    def save_user_account(self, account_data):
        account_data['updated_at'] = datetime.utcnow().isoformat()
        if 'created_at' not in account_data:
            account_data['created_at'] = datetime.utcnow().isoformat()
            
        if self.connected and self.db is not None:
            try:
                self.db.users.update_one(
                    {"email": account_data.get("email")},
                    {"$set": account_data},
                    upsert=True
                )
                logger.info(f"Saved user account credentials for {account_data.get('email')} in MongoDB Atlas.")
                return True
            except Exception as e:
                logger.error(f"MongoDB error in save_user_account: {e}")

        existing = next((u for u in self.memory_store["users"] if u.get("email") == account_data.get("email")), None)
        if existing:
            existing.update(account_data)
        else:
            self.memory_store["users"].append(account_data)
        return True

    def save_user_login_event(self, email, full_name="", status="SUCCESS", ip=None, user_agent=None):
        login_log = {
            "email": email,
            "full_name": full_name,
            "timestamp": datetime.utcnow().isoformat(),
            "status": status,
            "ip_address": ip,
            "user_agent": user_agent
        }
        
        if self.connected and self.db is not None:
            try:
                self.db.user_logins.insert_one(login_log)
                self.db.users.update_one(
                    {"email": email},
                    {"$set": {"last_login": login_log["timestamp"]}}
                )
                logger.info(f"Recorded login event for {email} in MongoDB Atlas.")
                return True
            except Exception as e:
                logger.error(f"MongoDB error in save_user_login_event: {e}")

        login_log["_id"] = f"log_{len(self.memory_store.get('user_logins', [])) + 1}"
        if "user_logins" not in self.memory_store:
            self.memory_store["user_logins"] = []
        self.memory_store["user_logins"].append(login_log)
        return True

    def get_user_account(self, email):
        if self.connected and self.db is not None:
            try:
                account = self.db.users.find_one({"email": email})
                if account and "_id" in account:
                    account["_id"] = str(account["_id"])
                return account
            except Exception as e:
                logger.error(f"MongoDB error in get_user_account: {e}")

        return next((u for u in self.memory_store["users"] if u.get("email") == email), None)

    # USER PROFILE METHODS
    def save_user_profile(self, user_data):
        user_data['updated_at'] = datetime.utcnow().isoformat()
        if self.connected and self.db is not None:
            try:
                self.db.student_profiles.update_one(
                    {"email": user_data.get("email")},
                    {"$set": user_data},
                    upsert=True
                )
                return True
            except Exception as e:
                logger.error(f"MongoDB error in save_user_profile: {e}")
        
        existing = next((u for u in self.memory_store["student_profiles"] if u.get("email") == user_data.get("email")), None)
        if existing:
            existing.update(user_data)
        else:
            self.memory_store["student_profiles"].append(user_data)
        return True

    def get_user_profile(self, email):
        if self.connected and self.db is not None:
            try:
                profile = self.db.student_profiles.find_one({"email": email})
                if profile and "_id" in profile:
                    profile["_id"] = str(profile["_id"])
                return profile
            except Exception as e:
                logger.error(f"MongoDB error in get_user_profile: {e}")

        return next((u for u in self.memory_store["student_profiles"] if u.get("email") == email), None)

    # RESUME ANALYSIS HISTORY & CRUD METHODS
    def save_resume_analysis(self, analysis_data):
        analysis_data['created_at'] = datetime.utcnow().isoformat()
        if self.connected and self.db is not None:
            try:
                res = self.db.resume_analyses.insert_one(analysis_data)
                analysis_data["_id"] = str(res.inserted_id)
                analysis_data["analysis_id"] = str(res.inserted_id)
                return analysis_data
            except Exception as e:
                logger.error(f"MongoDB error in save_resume_analysis: {e}")

        analysis_id = f"res_{len(self.memory_store['resume_analyses']) + 1}"
        analysis_data["_id"] = analysis_id
        analysis_data["analysis_id"] = analysis_id
        self.memory_store["resume_analyses"].append(analysis_data)
        return analysis_data

    def get_resume_analyses_for_user(self, email, limit=10):
        if self.connected and self.db is not None:
            try:
                cursor = self.db.resume_analyses.find({"user_email": email}).sort("created_at", -1).limit(limit)
                results = []
                for doc in cursor:
                    doc["_id"] = str(doc["_id"])
                    doc["analysis_id"] = str(doc["_id"])
                    results.append(doc)
                return results
            except Exception as e:
                logger.error(f"MongoDB error in get_resume_analyses_for_user: {e}")

        user_analyses = [a for a in self.memory_store["resume_analyses"] if a.get("user_email") == email]
        return sorted(user_analyses, key=lambda x: x.get("created_at", ""), reverse=True)[:limit]

    def get_resume_analysis_by_id(self, analysis_id, email):
        if self.connected and self.db is not None:
            try:
                doc = self.db.resume_analyses.find_one({"_id": ObjectId(analysis_id), "user_email": email})
                if doc:
                    doc["_id"] = str(doc["_id"])
                    doc["analysis_id"] = str(doc["_id"])
                    return doc
            except Exception as e:
                logger.error(f"MongoDB error in get_resume_analysis_by_id: {e}")

        return next((a for a in self.memory_store["resume_analyses"] if (a.get("analysis_id") == analysis_id or a.get("_id") == analysis_id) and a.get("user_email") == email), None)

    def delete_resume_analysis_by_id(self, analysis_id, email):
        if self.connected and self.db is not None:
            try:
                res = self.db.resume_analyses.delete_one({"_id": ObjectId(analysis_id), "user_email": email})
                return res.deleted_count > 0
            except Exception as e:
                logger.error(f"MongoDB error in delete_resume_analysis_by_id: {e}")

        initial_len = len(self.memory_store["resume_analyses"])
        self.memory_store["resume_analyses"] = [
            a for a in self.memory_store["resume_analyses"]
            if not ((a.get("analysis_id") == analysis_id or a.get("_id") == analysis_id) and a.get("user_email") == email)
        ]
        return len(self.memory_store["resume_analyses"]) < initial_len

    # INTERVIEW EXPERIENCES METHODS
    def save_interview_experience(self, exp_data):
        exp_data['created_at'] = datetime.utcnow().isoformat()
        exp_data['upvotes'] = exp_data.get('upvotes', 0)
        exp_data['is_approved'] = exp_data.get('is_approved', True)
        
        if self.connected and self.db is not None:
            try:
                res = self.db.interview_experiences.insert_one(exp_data)
                exp_data["_id"] = str(res.inserted_id)
                return exp_data
            except Exception as e:
                logger.error(f"MongoDB error in save_interview_experience: {e}")

        exp_data["_id"] = f"exp_{len(self.memory_store['interview_experiences']) + 1}"
        self.memory_store["interview_experiences"].insert(0, exp_data)
        return exp_data

    def get_all_interview_experiences(self, company=None, role=None, limit=50, include_unapproved=False):
        if self.connected and self.db is not None:
            try:
                query = {}
                if not include_unapproved:
                    query["is_approved"] = {"$ne": False}
                    query["status"] = {"$ne": "Rejected"}
                if company and company != "All":
                    query["company_name"] = re.compile(rf"^{re.escape(company)}$", re.IGNORECASE)
                if role and role != "All":
                    query["job_role"] = re.compile(rf".*{re.escape(role)}.*", re.IGNORECASE)

                cursor = self.db.interview_experiences.find(query).sort("created_at", -1).limit(limit)
                results = []
                for doc in cursor:
                    doc["_id"] = str(doc["_id"])
                    results.append(doc)
                return results
            except Exception as e:
                logger.error(f"MongoDB error in get_all_interview_experiences: {e}")

        exps = self.memory_store["interview_experiences"]
        if not include_unapproved:
            exps = [e for e in exps if e.get("is_approved") is not False and e.get("status") != "Rejected"]
        if company and company != "All":
            exps = [e for e in exps if e.get("company_name", "").lower() == company.lower()]
        if role and role != "All":
            exps = [e for e in exps if role.lower() in e.get("job_role", "").lower()]
        return sorted(exps, key=lambda x: x.get("created_at", ""), reverse=True)[:limit]

    def upvote_interview_experience(self, exp_id):
        if self.connected and self.db is not None:
            try:
                query_id = ObjectId(exp_id) if ObjectId.is_valid(str(exp_id)) else str(exp_id)
                self.db.interview_experiences.update_one(
                    {"_id": query_id},
                    {"$inc": {"upvotes": 1}}
                )
                doc = self.db.interview_experiences.find_one({"_id": query_id})
                if doc:
                    return doc.get("upvotes", 0)
            except Exception as e:
                logger.error(f"MongoDB error in upvote_interview_experience: {e}")

        exp = next((e for e in self.memory_store["interview_experiences"] if str(e.get("_id")) == str(exp_id)), None)
        if exp:
            exp["upvotes"] = exp.get("upvotes", 0) + 1
            return exp["upvotes"]
        return 0

    def update_interview_experience(self, exp_data):
        exp_id = exp_data.get("_id")
        if self.connected and self.db is not None:
            try:
                query_id = ObjectId(exp_id) if ObjectId.is_valid(str(exp_id)) else str(exp_id)
                update_payload = {k: v for k, v in exp_data.items() if k != "_id"}
                self.db.interview_experiences.update_one(
                    {"_id": query_id},
                    {"$set": update_payload}
                )
                return True
            except Exception as e:
                logger.error(f"MongoDB error in update_interview_experience: {e}")

        for i, e in enumerate(self.memory_store["interview_experiences"]):
            if str(e.get("_id")) == str(exp_id):
                self.memory_store["interview_experiences"][i].update(exp_data)
                return True
        return False

    def delete_interview_experience(self, exp_id):
        if self.connected and self.db is not None:
            try:
                query_id = ObjectId(exp_id) if ObjectId.is_valid(str(exp_id)) else str(exp_id)
                res = self.db.interview_experiences.delete_one({"_id": query_id})
                return res.deleted_count > 0
            except Exception as e:
                logger.error(f"MongoDB error in delete_interview_experience: {e}")

        initial_len = len(self.memory_store["interview_experiences"])
        self.memory_store["interview_experiences"] = [
            e for e in self.memory_store["interview_experiences"] if str(e.get("_id")) != str(exp_id)
        ]
        return len(self.memory_store["interview_experiences"]) < initial_len

    def flag_interview_experience(self, exp_id, reason="Community report"):
        if self.connected and self.db is not None:
            try:
                query_id = ObjectId(exp_id) if ObjectId.is_valid(str(exp_id)) else str(exp_id)
                self.db.interview_experiences.update_one(
                    {"_id": query_id},
                    {"$set": {"is_flagged": True, "flag_reason": reason}}
                )
                return True
            except Exception as e:
                logger.error(f"MongoDB error in flag_interview_experience: {e}")

        exp = next((e for e in self.memory_store["interview_experiences"] if str(e.get("_id")) == str(exp_id)), None)
        if exp:
            exp["is_flagged"] = True
            exp["flag_reason"] = reason
            return True
        return False

    # COMPANY ROADMAPS & MOCK INTERVIEW METHODS
    def save_company_roadmap(self, roadmap_data):
        roadmap_data['created_at'] = datetime.utcnow().isoformat()
        if self.connected and self.db is not None:
            try:
                res = self.db.company_roadmaps.insert_one(roadmap_data)
                roadmap_data["_id"] = str(res.inserted_id)
                return roadmap_data
            except Exception as e:
                logger.error(f"MongoDB error in save_company_roadmap: {e}")

        if "company_roadmaps" not in self.memory_store:
            self.memory_store["company_roadmaps"] = []
        roadmap_data["_id"] = f"rm_{len(self.memory_store['company_roadmaps']) + 1}"
        self.memory_store["company_roadmaps"].insert(0, roadmap_data)
        return roadmap_data

    def get_user_company_roadmaps(self, email, limit=10):
        if self.connected and self.db is not None:
            try:
                cursor = self.db.company_roadmaps.find({"user_email": email}).sort("created_at", -1).limit(limit)
                results = []
                for doc in cursor:
                    doc["_id"] = str(doc["_id"])
                    results.append(doc)
                return results
            except Exception as e:
                logger.error(f"MongoDB error in get_user_company_roadmaps: {e}")

        rms = self.memory_store.get("company_roadmaps", [])
        user_rms = [r for r in rms if r.get("user_email") == email]
        return sorted(user_rms, key=lambda x: x.get("created_at", ""), reverse=True)[:limit]

    def save_mock_interview_session(self, session_data):
        session_data['updated_at'] = datetime.utcnow().isoformat()
        if self.connected and self.db is not None:
            try:
                self.db.mock_interviews.update_one(
                    {"session_id": session_data.get("session_id")},
                    {"$set": session_data},
                    upsert=True
                )
                return session_data
            except Exception as e:
                logger.error(f"MongoDB error in save_mock_interview_session: {e}")

        if "mock_interviews" not in self.memory_store:
            self.memory_store["mock_interviews"] = []
        existing = next((m for m in self.memory_store["mock_interviews"] if m.get("session_id") == session_data.get("session_id")), None)
        if existing:
            existing.update(session_data)
        else:
            self.memory_store["mock_interviews"].append(session_data)
        return session_data

    def get_mock_interview_session(self, session_id, email):
        if self.connected and self.db is not None:
            try:
                doc = self.db.mock_interviews.find_one({"session_id": session_id, "user_email": email})
                if doc:
                    doc["_id"] = str(doc["_id"])
                    return doc
            except Exception as e:
                logger.error(f"MongoDB error in get_mock_interview_session: {e}")

        return next((m for m in self.memory_store.get("mock_interviews", []) if m.get("session_id") == session_id and m.get("user_email") == email), None)

    def add_turn_to_mock_interview(self, session_id, email, turn_record):
        if self.connected and self.db is not None:
            try:
                self.db.mock_interviews.update_one(
                    {"session_id": session_id, "user_email": email},
                    {
                        "$push": {"turns": turn_record},
                        "$inc": {"current_question_index": 1},
                        "$set": {"updated_at": datetime.utcnow().isoformat()}
                    }
                )
                return True
            except Exception as e:
                logger.error(f"MongoDB error in add_turn_to_mock_interview: {e}")

        session = self.get_mock_interview_session(session_id, email)
        if session:
            if "turns" not in session:
                session["turns"] = []
            session["turns"].append(turn_record)
            session["current_question_index"] = session.get("current_question_index", 0) + 1
            session["updated_at"] = datetime.utcnow().isoformat()
            return True
        return False

    def update_mock_interview_status(self, session_id, email, status, report):
        if self.connected and self.db is not None:
            try:
                self.db.mock_interviews.update_one(
                    {"session_id": session_id, "user_email": email},
                    {
                        "$set": {
                            "status": status,
                            "report": report,
                            "updated_at": datetime.utcnow().isoformat()
                        }
                    }
                )
                return True
            except Exception as e:
                logger.error(f"MongoDB error in update_mock_interview_status: {e}")

        session = self.get_mock_interview_session(session_id, email)
        if session:
            session["status"] = status
            session["report"] = report
            session["updated_at"] = datetime.utcnow().isoformat()
            return True
        return False

    def get_user_mock_interview_reports(self, email, limit=10):
        if self.connected and self.db is not None:
            try:
                cursor = self.db.mock_interviews.find({"user_email": email, "status": "COMPLETED"}).sort("updated_at", -1).limit(limit)
                results = []
                for doc in cursor:
                    doc["_id"] = str(doc["_id"])
                    results.append(doc)
                return results
            except Exception as e:
                logger.error(f"MongoDB error in get_user_mock_interview_reports: {e}")

        sessions = self.memory_store.get("mock_interviews", [])
        user_completed = [s for s in sessions if s.get("user_email") == email and s.get("status") == "COMPLETED"]
        return sorted(user_completed, key=lambda x: x.get("updated_at", ""), reverse=True)[:limit]

db_service = MongoDBService()

