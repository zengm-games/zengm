from distutils.core import setup
from glob import glob

setup(name='Basketball GM',
      version='1.0.0alpha',
      description='A basketball simulation game. Make trades, set rosters, draft players, and try to build the next dynasty.',
      license='AGPLv3',
      url='https://github.com/jdscheff/basketball-gm',
      maintainer='Jeremy Scheff',
      maintainer_email='jdscheff@gmail.com',
      packages=['bbgm', 'bbgm.core', 'bbgm.views', 'bbgm.util'],
      data_files=[
          ('share/basketball-gm/data', glob("data/*.*")),
          ('share/basketball-gm/ui', glob("ui/*.*")),
          ('share/icons/scalable/apps', ['ui/basketball-gm.svg']),
          ('share/applications', ['ui/basketball-gm.desktop']),
      ],
      scripts=['bin/basketball-gm']
     )

