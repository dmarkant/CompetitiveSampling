from sqlalchemy import *

def load_from_mysql(**kwargs):

    dburl = kwargs['dburl']
    columnname = kwargs.get('columnname', 'datastring')
    tablename = kwargs['tablename']
    codeversion = str(kwargs.get('codeversion', "1.0"))
    exclude = kwargs.get('exclude', [])

    engine = create_engine(dburl)
    metadata = MetaData()
    metadata.bind = engine
    table = Table(tablename, metadata, autoload=True)

    # making a query and looping through
    s = table.select()
    rs = s.execute()
    data = {}
    for row in rs:
        if (row['status'] >=3) and (row['codeversion'] == codeversion) and (row['workerid'] not in exclude):
            workerid = row['workerid']
            data[workerid] = row[columnname]

    return data
