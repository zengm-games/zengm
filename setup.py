from distutils.core import setup
from glob import glob

setup(name='Basketball GM',
      version='0.1+',
      description='A basketball simulation game. Make trades, set rosters, draft players, and try to build the next dynasty.',
      license='AGPLv3',
      url='https://github.com/jdscheff/basketball-gm',
      maintainer='Jeremy Scheff',
      maintainer_email='jdscheff@gmail.com',
      packages=['bbgm', 'bbgm.core', 'bbgm.views', 'bbgm.util'],
      data_files=[
    ('share/basketball-gm/data', glob("data/*.*")),
    ('share/basketball-gm/ui', glob("ui/*.*")),
    # Icon stuff
    ],
      scripts=['bin/basketball-gm']
     )

