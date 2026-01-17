<script lang="ts">
    import Sidebar from './Sidebar.svelte';
    import IconClose from '$lib/icons/IconClose.svelte';
    import { weatherState } from '$lib/weather.svelte';
    import { fade, fly } from 'svelte/transition';
    import '$lib/styles/mobile.css';
</script>

<div class="mobile-menu" transition:fade={{ duration: 200 }}>
    <div class="menu-top-bar" transition:fly={{ y: -20, duration: 300 }}>
        <h2>Settings & Cities</h2>
        <div class="controls-group">
            <button 
                class="edit-btn {weatherState.isEditing ? 'active' : ''}" 
                onclick={() => weatherState.isEditing = !weatherState.isEditing}
            >
                {weatherState.isEditing ? '✅' : '⚙️'}
            </button>
            <button class="close-menu-top" onclick={() => { weatherState.menuOpen = false; weatherState.isEditing = false; }}>
                <IconClose />
            </button>
        </div>
    </div>
    
    <div transition:fly={{ y: 20, duration: 400 }}>
        <Sidebar isMobile={true} />
    </div>
</div>