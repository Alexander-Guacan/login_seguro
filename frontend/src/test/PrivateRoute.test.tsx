import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { useAuth } from "../hooks/auth/useAuth";
import { PrivateRoute } from "../components/auth/PrivateRoute";
import { UserRole } from "../enums/userRole.enum";
import { User } from "../models/user";

vi.mock("../hooks/auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../pages/LoadingPage", () => ({
  LoadingPage: () => <div>LoadingPageMock</div>,
}));

const mockedUseAuth = vi.mocked(useAuth);

type UseAuthReturn = ReturnType<typeof useAuth>;

const baseMockAuth: UseAuthReturn = {
  user: null,
  loading: false,
  login: vi.fn(),
  logout: vi.fn(),
  credentialLogin: vi.fn(),
  faceLogin: vi.fn(),
  register: vi.fn(),
  reloadSession: vi.fn(),
};

const mockUser = new User({
  id: "1",
  email: "admin@test.com",
  firstName: "Juan",
  lastName: "Perez",
  role: UserRole.ADMIN,
  isActive: true,
});

describe("PrivateRoute", () => {
  it("muestra loading cuando está cargando", () => {
    mockedUseAuth.mockReturnValue({
      ...baseMockAuth,
      loading: true,
    });

    render(
      <MemoryRouter>
        <PrivateRoute />
      </MemoryRouter>,
    );

    expect(screen.getByText("LoadingPageMock")).toBeInTheDocument();
  });

  it("redirige al home si no hay usuario", () => {
    mockedUseAuth.mockReturnValue({
      ...baseMockAuth,
      user: null,
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Route>
          <Route path="/" element={<div>Home</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("renderiza el contenido si hay usuario", () => {
    mockedUseAuth.mockReturnValue({
      ...baseMockAuth,
      user: mockUser,
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });
});
