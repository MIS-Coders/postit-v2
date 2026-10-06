<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		mood?: 'idle' | 'thinking' | 'talking';
		// melirik ke arah kursor dan bereaksi saat diklik
		interactive?: boolean;
		// tanpa animasi, untuk avatar di pesan lama supaya halaman tetap ringan
		still?: boolean;
		class?: string;
	}

	let { mood = 'idle', interactive = false, still = false, class: className }: Props = $props();

	let root = $state<HTMLElement | null>(null);
	let look = $state({ x: 0, y: 0 });
	let booped = $state(false);

	function follow(event: PointerEvent) {
		if (!root) return;
		const box = root.getBoundingClientRect();
		const dx = event.clientX - (box.left + box.width / 2);
		const dy = event.clientY - (box.top + box.height / 2);
		const distance = Math.hypot(dx, dy) || 1;
		// makin jauh kursor makin jauh lirikannya, mentok di 1.5x lebar maskot
		const reach = Math.min(distance / (box.width * 1.5), 1);
		look = { x: (dx / distance) * reach, y: (dy / distance) * reach };
	}

	function boop() {
		booped = true;
		setTimeout(() => (booped = false), 700);
	}
</script>

<svelte:window onpointermove={interactive && !still ? follow : undefined} />

<svelte:element
	this={interactive ? 'button' : 'span'}
	bind:this={root}
	type={interactive ? 'button' : undefined}
	aria-label={interactive ? 'Maskot asisten' : undefined}
	aria-hidden={interactive ? undefined : true}
	class={cn('mascot', className)}
	data-mood={mood}
	data-still={still ? '' : undefined}
	data-boop={booped ? '' : undefined}
	style="--lx: {look.x.toFixed(3)}; --ly: {look.y.toFixed(3)}"
	onclick={interactive ? boop : undefined}
>
	<span class="bob">
		<span class="orb">
			<span class="swirl">
				<span class="blob mint"></span>
				<span class="blob teal"></span>
				<span class="blob deep"></span>
				<span class="blob lime"></span>
				<span class="blob cyan"></span>
			</span>
			<span class="blob spot"></span>
			<span class="rim"></span>
			<span class="eyes">
				{#each [0, 1] as eye (eye)}
					<svg class="eye" viewBox="0 0 40 44" aria-hidden="true">
						<path d="M20 7 32 37 20 31 8 37Z" fill="#fff" stroke="#fff" stroke-width="9" stroke-linejoin="round" />
					</svg>
				{/each}
			</span>
		</span>
	</span>
</svelte:element>

<style>
	/* Semua ukuran di dalam maskot memakai cqw supaya ikut skala dari avatar kecil sampai hero. */
	.mascot {
		position: relative;
		display: inline-block;
		flex-shrink: 0;
		aspect-ratio: 1;
		container-type: inline-size;
		border: 0;
		padding: 0;
		background: none;
		border-radius: 50%;
		-webkit-tap-highlight-color: transparent;
	}
	button.mascot {
		cursor: pointer;
	}

	.bob {
		position: absolute;
		inset: 0;
		animation: bob 5s ease-in-out infinite;
	}

	.orb {
		position: absolute;
		inset: 0;
		overflow: hidden;
		isolation: isolate;
		border-radius: 50%;
		background: radial-gradient(circle at 38% 32%, #34d399, #10b981 55%, #059669);
		box-shadow: 0 4cqw 10cqw -3cqw rgb(16 185 129 / 0.5);
		transform: translate(calc(var(--lx) * 2.5cqw), calc(var(--ly) * 2.5cqw));
		transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
	}

	.swirl {
		position: absolute;
		inset: -8%;
		animation: spin 18s linear infinite;
	}

	.blob {
		position: absolute;
		border-radius: 50%;
		filter: blur(9cqw);
	}
	.mint {
		top: -6%;
		left: -6%;
		width: 68%;
		height: 68%;
		background: #a7f3d0;
		animation: drift-a 9s ease-in-out infinite alternate;
	}
	.teal {
		top: 4%;
		right: -10%;
		width: 62%;
		height: 74%;
		background: #14b8a6;
		animation: drift-b 11s ease-in-out infinite alternate;
	}
	.deep {
		top: 32%;
		left: 28%;
		width: 44%;
		height: 44%;
		background: #047857;
		animation: drift-c 13s ease-in-out infinite alternate;
	}
	.lime {
		bottom: -12%;
		left: 2%;
		width: 60%;
		height: 50%;
		background: #a3e635;
		animation: drift-b 10s ease-in-out infinite alternate-reverse;
	}
	.cyan {
		right: 0;
		bottom: 0;
		width: 38%;
		height: 38%;
		background: #22d3ee;
		opacity: 0.55;
		animation: drift-a 12s ease-in-out infinite alternate-reverse;
	}
	/* sorot terang yang mengikuti kursor */
	.spot {
		top: 29%;
		left: 29%;
		width: 42%;
		height: 42%;
		background: rgb(255 255 255 / 0.28);
		transform: translate(calc(var(--lx) * 26cqw), calc(var(--ly) * 26cqw));
		transition: transform 0.7s ease-out;
	}

	.rim {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		box-shadow:
			inset 0 0 6cqw 1.5cqw rgb(255 255 255 / 0.65),
			inset 0 0 1.2cqw 0.4cqw rgb(255 255 255 / 0.9);
	}

	.eyes {
		position: absolute;
		top: 44%;
		left: 50%;
		display: flex;
		justify-content: space-between;
		width: 46%;
		filter: drop-shadow(0 0 2.5cqw rgb(255 255 255 / 0.9));
		transform: translate(-50%, -50%) translate(calc(var(--lx) * 9cqw), calc(var(--ly) * 7cqw));
		transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	.eye {
		width: 38%;
		transform-origin: 50% 60%;
		animation: blink 5.2s infinite;
	}

	/* sedang mencari jawaban: gradasi berputar cepat, mata melirik ke atas kiri-kanan */
	.mascot[data-mood='thinking'] .swirl {
		animation-duration: 3.5s;
	}
	.mascot[data-mood='thinking'] .eyes {
		animation: ponder 1.8s ease-in-out infinite;
	}

	/* sedang menjawab: badan berdenyut pelan */
	.mascot[data-mood='talking'] .bob {
		animation: talk 0.45s ease-in-out infinite alternate;
	}

	.mascot[data-boop] .orb {
		animation: boop 0.7s cubic-bezier(0.3, 1.6, 0.5, 1);
	}
	.mascot[data-boop] .eye {
		animation: none;
		transform: scaleY(0.3);
	}

	.mascot[data-still] :is(.bob, .swirl, .blob, .eyes, .eye) {
		animation: none;
	}

	@media (prefers-reduced-motion: reduce) {
		.mascot :is(.bob, .orb, .swirl, .blob, .eyes, .eye) {
			animation: none;
		}
	}

	@keyframes bob {
		50% {
			transform: translateY(-3.5cqw);
		}
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	@keyframes drift-a {
		to {
			transform: translate(16cqw, 12cqw) scale(1.15);
		}
	}
	@keyframes drift-b {
		to {
			transform: translate(-14cqw, 10cqw) scale(0.9);
		}
	}
	@keyframes drift-c {
		to {
			transform: translate(8cqw, -14cqw) scale(1.2);
		}
	}
	@keyframes blink {
		0%,
		93%,
		100% {
			transform: scaleY(1);
		}
		96.5% {
			transform: scaleY(0.08);
		}
	}
	@keyframes ponder {
		0%,
		100% {
			transform: translate(-50%, -50%) translate(-7cqw, -6cqw);
		}
		50% {
			transform: translate(-50%, -50%) translate(7cqw, -6cqw);
		}
	}
	@keyframes talk {
		to {
			transform: scale(1.06);
		}
	}
	@keyframes boop {
		30% {
			transform: scale(1.14, 0.86);
		}
		60% {
			transform: scale(0.94, 1.06);
		}
	}
</style>
