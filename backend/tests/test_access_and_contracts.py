import unittest

from app.database import SessionLocal, engine
from app.main import app
from app.models import Customer, Lead, User
from app.routes.customers import get_customer_query
from app.routes.leads import get_lead_query
from app.schemas import LeadCreate


class AccessAndContractTests(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()
        self.admin = self.db.query(User).filter(User.role == "Admin").first()
        self.manager = self.db.query(User).filter(User.role == "Manager").first()
        self.employee = self.db.query(User).filter(User.role == "Employee").first()
        self.assertIsNotNone(self.admin)
        self.assertIsNotNone(self.manager)
        self.assertIsNotNone(self.employee)

    def tearDown(self):
        self.db.close()

    @classmethod
    def tearDownClass(cls):
        engine.dispose()

    def test_employee_scope_excludes_unassigned_and_other_teams(self):
        customer_assignments = {
            item.assigned_to for item in get_customer_query(self.db, self.employee).all()
        }
        lead_ids = {item.id for item in get_lead_query(self.db, self.employee).all()}
        self.assertTrue(customer_assignments.issubset({self.employee.id}))
        admin_lead_ids = {
            item.id for item in self.db.query(Lead).filter(Lead.assigned_to == self.admin.id).all()
        }
        self.assertTrue(admin_lead_ids.isdisjoint(lead_ids))

    def test_manager_scope_includes_team_but_not_admin_records(self):
        manager_ids = {self.manager.id}
        manager_ids.update(
            row[0] for row in self.db.query(User.id).filter(User.manager_id == self.manager.id).all()
        )
        customer_ids = {
            item.assigned_to for item in get_customer_query(self.db, self.manager).all()
        }
        self.assertTrue(customer_ids.issubset(manager_ids))
        self.assertNotIn(
            self.db.query(Lead.id).filter(Lead.assigned_to == self.admin.id).scalar(),
            {item.id for item in get_lead_query(self.db, self.manager).all()},
        )

    def test_lead_stage_validation_and_routes_are_published(self):
        with self.assertRaises(ValueError):
            LeadCreate(
                name="Invalid",
                email="invalid@example.com",
                phone="1234567",
                source="test",
                expected_deal_value=0,
                stage="Invalid",
            )
        paths = app.openapi()["paths"]
        self.assertIn("/admin/employees/{employee_id}/manager", paths)
        self.assertIn("/search", paths)
        self.assertIn("/notifications/{notification_id}/read", paths)


if __name__ == "__main__":
    unittest.main()
