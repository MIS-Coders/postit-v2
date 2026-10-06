import { ag as head, ai as escape_html, ah as attr } from '../../../chunks/server.js-Dzkc9wbJ.js';
import '../../../chunks/shared.js-CcLTIra1.js';

//#region src/routes/login/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { form } = $$props;
		head("1x05zx6", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>Masuk · PostIt</title>`);
			});
		});
		$$renderer.push(`<main class="flex min-h-dvh items-center justify-center bg-muted p-4"><section class="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm md:p-8"><a href="/sop" class="flex items-center gap-2 text-lg font-semibold tracking-tight"><span class="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">P</span> PostIt</a> <h1 class="mt-8 text-2xl font-semibold">${escape_html("Masuk")}</h1> <p class="mt-1 text-sm text-muted-foreground">${escape_html("Masuk untuk mengelola dokumen sesuai akses Anda.")}</p> `);
		if (form?.error) $$renderer.push(`<!--[0--><p class="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">${escape_html(form.error)}</p>`);
		else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <form method="POST"${attr("action", "?/signIn")} class="mt-6 space-y-4">`);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <label class="block text-sm font-medium">Email<input class="mt-1 w-full rounded-lg border bg-background px-3 py-2" name="email" type="email" required=""/></label> <label class="block text-sm font-medium">Password<input class="mt-1 w-full rounded-lg border bg-background px-3 py-2" name="password" type="password" minlength="8" required=""/></label> <button class="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition hover:bg-primary/90" type="submit">${escape_html("Masuk")}</button></form> <button class="mt-5 text-sm font-medium text-primary hover:underline" type="button">${escape_html("Belum punya akun? Daftar")}</button></section></main>`);
	});
}

export { _page as default };
//# sourceMappingURL=_page.svelte.js-C38_oXCx.js.map
