from app.db.supabase_client import db

def main():
    with db.get_cursor() as cur:
        cur.execute("SELECT id, title, user_id FROM chapters WHERE id::text LIKE '24456e71%';")
        ch = cur.fetchone()
        if not ch:
            print("Chapter not found")
            return
        cid = ch['id']
        print(f"Chapter: {cid} - {ch['title']}")
        cur.execute("SELECT id, label, is_hobby_anchor FROM concept_nodes WHERE chapter_id = %s;", (cid,))
        nodes = cur.fetchall()
        for n in nodes:
            print(f"  Node: {n['id']} | Label: {n['label']} | is_hobby: {n['is_hobby_anchor']}")
        cur.execute("SELECT source_node_id, target_node_id, relationship_label FROM concept_edges WHERE chapter_id = %s;", (cid,))
        edges = cur.fetchall()
        print(f"Edges: {len(edges)}")
        for e in edges:
            print(f"  Edge: {e['source_node_id']} -> {e['target_node_id']}")

if __name__ == '__main__':
    main()
