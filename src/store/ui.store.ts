import { create } from "zustand";

export interface UiState {
	isCartDrawerOpen: boolean;
	isSizeGuideOpen: boolean;
	isMobileMenuOpen: boolean;
}

const initialUiState: UiState = {
	isCartDrawerOpen: false,
	isSizeGuideOpen: false,
	isMobileMenuOpen: false,
};

export const useUiStore = create<UiState>()(() => initialUiState);

export const uiActions = {
	openCartDrawer(): void {
		useUiStore.setState({
			isCartDrawerOpen: true,
			isMobileMenuOpen: false,
		});
	},

	closeCartDrawer(): void {
		useUiStore.setState({ isCartDrawerOpen: false });
	},

	setCartDrawerOpen(open: boolean): void {
		useUiStore.setState((state) => ({
			isCartDrawerOpen: open,
			isMobileMenuOpen: open ? false : state.isMobileMenuOpen,
		}));
	},

	toggleCartDrawer(): void {
		useUiStore.setState((state) => ({
			isCartDrawerOpen: !state.isCartDrawerOpen,
			isMobileMenuOpen: !state.isCartDrawerOpen
				? false
				: state.isMobileMenuOpen,
		}));
	},

	openSizeGuide(): void {
		useUiStore.setState({ isSizeGuideOpen: true });
	},

	closeSizeGuide(): void {
		useUiStore.setState({ isSizeGuideOpen: false });
	},

	setSizeGuideOpen(open: boolean): void {
		useUiStore.setState({ isSizeGuideOpen: open });
	},

	openMobileMenu(): void {
		useUiStore.setState({
			isMobileMenuOpen: true,
			isCartDrawerOpen: false,
		});
	},

	closeMobileMenu(): void {
		useUiStore.setState({ isMobileMenuOpen: false });
	},

	setMobileMenuOpen(open: boolean): void {
		useUiStore.setState((state) => ({
			isMobileMenuOpen: open,
			isCartDrawerOpen: open ? false : state.isCartDrawerOpen,
		}));
	},

	resetUiState(): void {
		useUiStore.setState(initialUiState);
	},
};
