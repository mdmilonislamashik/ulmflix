async function updateNavbarAuthUI() {
    const user = await getCurrentUser();
    const navRight = document.querySelector('.nav-right') || document.querySelector('nav');
    
    if (!navRight) return;

    let authContainer = document.getElementById('authContainer');
    if (!authContainer) {
        authContainer = document.createElement('div');
        authContainer.id = 'authContainer';
        authContainer.style.display = 'inline-block';
        navRight.appendChild(authContainer);
    }

    if (user) {
        const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || 'assets/images/placeholder-action.svg';
        const fullName = user.user_metadata?.full_name || user.email || 'User';

        authContainer.innerHTML = `
            <div class="profile-dropdown" style="position: relative; display: inline-block;">
                <button id="profileMenuBtn" style="background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                    <img src="${avatar}" alt="Profile" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 2px solid #e50914;">
                </button>
                <div id="profileDropdownMenu" style="display: none; position: absolute; right: 0; top: 45px; background: #181818; border: 1px solid #333; border-radius: 8px; width: 220px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); z-index: 1000; padding: 10px;">
                    <div style="padding: 10px; border-bottom: 1px solid #333; margin-bottom: 8px;">
                        <p style="color: #fff; font-weight: bold; margin: 0; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${fullName}</p>
                        <p style="color: #aaa; font-size: 12px; margin: 2px 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user.email}</p>
                    </div>
                    <a href="#" id="logoutBtn" style="display: block; padding: 8px 10px; color: #e50914; text-decoration: none; font-size: 14px; border-radius: 4px; transition: background 0.2s;">Logout</a>
                </div>
            </div>
        `;

        const profileMenuBtn = document.getElementById('profileMenuBtn');
        const profileDropdownMenu = document.getElementById('profileDropdownMenu');
        const logoutBtn = document.getElementById('logoutBtn');

        profileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdownMenu.style.display = profileDropdownMenu.style.display === 'block' ? 'none' : 'block';
        });

        document.addEventListener('click', () => {
            if (profileDropdownMenu) profileDropdownMenu.style.display = 'none';
        });

        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            signOutUser();
        });

    } else {
        authContainer.innerHTML = `
            <button id="googleLoginBtn" class="btn btn-red" style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer;">
                Continue with Google
            </button>
        `;

        const loginBtn = document.getElementById('googleLoginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', signInWithGoogle);
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    updateNavbarAuthUI();
});
