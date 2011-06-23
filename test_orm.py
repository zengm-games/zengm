from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import *

engine = create_engine('sqlite://')

Base.metadata.create_all(engine) 

Session = sessionmaker(bind=engine)
session = Session()

c = Conf(name='Bob')
session.add(c)

d = Div(name='Bobby', conf=c)
session.add(d)

d2 = Div(name='Bobby2', conf=c)
session.add(d2)

session.commit()

print c, d, d2
