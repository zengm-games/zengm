"""
bbgm.util.resources

This is based on the file of the same name from Gwibber. It is designed to
allow the software to load files correctly when it is installed and when it is
just run from a folder with the source code.

First, it looks for files in the same folder as the code. Then, it looks for
files in the usual places (/usr/local/share/basketball-gm, etc).
"""

import os

from bbgm import common

PROGRAM_NAME = 'basketball-gm'

try:
  import xdg
  DATA_BASE_DIRS = xdg.BaseDirectory.xdg_data_dirs
except:
  DATA_BASE_DIRS = [
    os.path.join(os.path.expanduser('~'), '.local', 'share'),
    '/usr/local/share', '/usr/share']

DATA_DIRS = [os.path.join(common.SRC_FOLDER, '..')];
DATA_DIRS += [os.path.join(d, PROGRAM_NAME) for d in DATA_BASE_DIRS]

def get_asset(asset_type, asset_name):
    """Get the path to a UI or data file.

    Args:
        asset_type: Either ui or data, depending on the asset type (this
            corresponds to the folder the file is in).
        asset_name: File name of the asset.

    Returns:
        A string containing the full path to the file, or None if the file
        cannot be found.
    """
    for base in DATA_DIRS:
        asset_path = os.path.join(base, asset_type, asset_name)
        if os.path.exists(asset_path):
            if common.DEBUG:
                print asset_path
            return asset_path
    return None

