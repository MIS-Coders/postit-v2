"""Ambil tabel departement + sopdoc (yang aktif) dari dump Postgres PostIt ke JSON.

Dipakai selama Postgres lokal belum jalan: web membaca JSON ini lewat
web/src/lib/server/sop.ts. Setelah database siap, modul itu diganti query SQL
dan script ini tidak diperlukan lagi.

    python3 scripts/sop_json_from_sql.py <postit.sql> storage/sop-data.json
"""

import json
import sys

DEPT_COLS = ['id', 'nama_departement', 'userid_head', 'userid_spi', 'input_by_userid', 'input_date',
             'edit_by_userid', 'edit_date', 'void_by_userid', 'void_date', 'void_status']
SOP_COLS = ['id', 'departement_id', 'type_doc', 'no_dokumen', 'nama_dokumen', 'no_rev', 'tgl_berlaku',
            'tgl_expired', 'file', 'input_by_userid', 'input_date', 'edit_by_userid', 'edit_date',
            'void_by_userid', 'void_date', 'void_status']


def insert_values(sql: str, table: str) -> str:
    start = sql.index(f'INSERT INTO {table} (')
    return sql[sql.index('VALUES', start) + 6:sql.index(';\n', start)]


def tuples(body: str):
    """Parser sederhana untuk `(v, 'teks', NULL), (...)` dengan escape '' di string."""
    i, n = 0, len(body)
    while i < n:
        if body[i] != '(':
            i += 1
            continue
        i += 1
        vals, cur, in_str, quoted = [], '', False, False
        while True:
            c = body[i]
            if in_str:
                if c == "'":
                    if i + 1 < n and body[i + 1] == "'":
                        cur += "'"
                        i += 2
                        continue
                    in_str = False
                else:
                    cur += c
                i += 1
                continue
            if c == "'":
                in_str, quoted, cur = True, True, ''
            elif c in ',)':
                raw = cur.strip()
                vals.append(cur if quoted else (None if raw == 'NULL' else int(raw)))
                cur, quoted = '', False
                if c == ')':
                    i += 1
                    break
            else:
                cur += c
            i += 1
        yield vals


def main(src: str, dst: str):
    sql = open(src, encoding='utf-8').read()
    depts = [dict(zip(DEPT_COLS, t)) for t in tuples(insert_values(sql, 'departement'))]
    docs = [dict(zip(SOP_COLS, t)) for t in tuples(insert_values(sql, 'sopdoc'))]

    out = {
        'departement': [
            {'id': d['id'], 'nama_departement': d['nama_departement']}
            for d in depts if d['void_status'] == 0
        ],
        'sopdoc': [
            {k: d[k] for k in ('id', 'departement_id', 'type_doc', 'no_dokumen', 'nama_dokumen',
                               'no_rev', 'tgl_berlaku', 'tgl_expired', 'file')}
            for d in docs if d['void_status'] == 0
        ],
    }
    with open(dst, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False)
    print(f"departement: {len(out['departement'])}, sopdoc aktif: {len(out['sopdoc'])} -> {dst}")


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
