import { ag as head, ai as escape_html, al as attr_class, am as clsx$1, an as ensure_array_like, ah as attr } from '../../../../chunks/server.js-Dzkc9wbJ.js';
import '../../../../chunks/shared.js-CcLTIra1.js';

//#region src/routes/(app)/users/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data, form } = $$props;
		const field = "mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
		const roles = [
			"user",
			"admin",
			"superadmin"
		];
		function formattedDate(date) {
			return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(date));
		}
		head("12zopc2", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>Pengguna · PostIt</title>`);
			});
		});
		$$renderer.push(`<section class="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-10 md:py-8"><div class="mx-auto max-w-6xl"><div><h1 class="text-2xl font-semibold tracking-tight">Manajemen Pengguna</h1> <p class="mt-1 text-sm text-muted-foreground">Tambah, ubah role, atau hapus akses pengguna PostIt.</p></div> `);
		if (form?.error) $$renderer.push(`<!--[0--><p class="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">${escape_html(form.error)}</p>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <form method="POST" action="?/create" class="mt-6 rounded-2xl border bg-card p-5 md:p-6"><h2 class="font-semibold">Tambah pengguna</h2> <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><label class="text-sm font-medium">Nama<input${attr_class(clsx$1(field))} name="name" autocomplete="name" required=""/></label> <label class="text-sm font-medium">Email<input${attr_class(clsx$1(field))} name="email" type="email" autocomplete="email" required=""/></label> <label class="text-sm font-medium">Password awal<input${attr_class(clsx$1(field))} name="password" type="password" minlength="8" autocomplete="new-password" required=""/></label> <label class="text-sm font-medium">Role `);
		$$renderer.select({
			class: field,
			name: "role",
			value: "user"
		}, ($$renderer) => {
			$$renderer.push(`<!--[-->`);
			const each_array = ensure_array_like(roles);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let role = each_array[$$index];
				$$renderer.option({ value: role }, ($$renderer) => {
					$$renderer.push(`${escape_html(role)}`);
				});
			}
			$$renderer.push(`<!--]-->`);
		});
		$$renderer.push(`</label></div> <button class="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90" type="submit">Tambah pengguna</button></form> <div class="mt-6 overflow-hidden rounded-2xl border bg-card"><div class="border-b px-5 py-4 md:px-6"><h2 class="font-semibold">Daftar pengguna</h2></div> <div class="divide-y"><!--[-->`);
		const each_array_1 = ensure_array_like(data.users);
		for (let $$index_3 = 0, $$length = each_array_1.length; $$index_3 < $$length; $$index_3++) {
			let account = each_array_1[$$index_3];
			$$renderer.push(`<div class="p-5 md:px-6"><form method="POST" action="?/update" class="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_10rem_auto] md:items-end"><input type="hidden" name="userId"${attr("value", account.id)}/> <label class="text-sm font-medium">Nama<input${attr_class(clsx$1(field))} name="name"${attr("value", account.name)} required=""/></label> <label class="text-sm font-medium">Email<input${attr_class(`${field} text-muted-foreground`)}${attr("value", account.email)} disabled=""/></label> <label class="text-sm font-medium">Role `);
			if (account.id === data.userId) {
				$$renderer.push(`<!--[0--><input name="role" type="hidden"${attr("value", account.role)}/> `);
				$$renderer.select({
					class: field,
					value: account.role,
					disabled: true
				}, ($$renderer) => {
					$$renderer.push(`<!--[-->`);
					const each_array_2 = ensure_array_like(roles);
					for (let $$index_1 = 0, $$length = each_array_2.length; $$index_1 < $$length; $$index_1++) {
						let role = each_array_2[$$index_1];
						$$renderer.option({ value: role }, ($$renderer) => {
							$$renderer.push(`${escape_html(role)}`);
						});
					}
					$$renderer.push(`<!--]-->`);
				});
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.select({
					class: field,
					name: "role",
					value: account.role
				}, ($$renderer) => {
					$$renderer.push(`<!--[-->`);
					const each_array_3 = ensure_array_like(roles);
					for (let $$index_2 = 0, $$length = each_array_3.length; $$index_2 < $$length; $$index_2++) {
						let role = each_array_3[$$index_2];
						$$renderer.option({ value: role }, ($$renderer) => {
							$$renderer.push(`${escape_html(role)}`);
						});
					}
					$$renderer.push(`<!--]-->`);
				});
			}
			$$renderer.push(`<!--]--></label> <button class="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted" type="submit">Simpan</button></form> <div class="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground"><span>Dibuat ${escape_html(formattedDate(account.createdAt))}</span> `);
			if (account.id !== data.userId) $$renderer.push(`<!--[0--><form method="POST" action="?/delete"><input type="hidden" name="userId"${attr("value", account.id)}/> <button class="font-medium text-destructive transition hover:underline" type="submit">Hapus pengguna</button></form>`);
			else $$renderer.push(`<!--[-1--><span>Akun Anda</span>`);
			$$renderer.push(`<!--]--></div></div>`);
		}
		$$renderer.push(`<!--]--></div></div></div></section>`);
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte.js-DA0D44Qx.js.map
