from flask_sqlalchemy import SQLAlchemy

# Create DB instance
Db = SQLAlchemy()


class Vaccine(Db.Model):
    # Fields
    __tablename__ = 'info'
    vac_id = Db.Column(Db.Integer, primary_key=True)
    vac_type = Db.Column(Db.String(30), nullable=False)
    country = Db.Column(Db.String(50), nullable=True)
    stage = Db.Column(Db.Integer, nullable=False)
    website = Db.Column(Db.String(300), nullable=True)
    company = Db.Column(Db.String(200), nullable=True)
