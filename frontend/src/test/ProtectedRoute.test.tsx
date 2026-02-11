import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { useAuth } from "../hooks/auth/useAuth";
import { UserRole } from "../enums/userRole.enum";
import { User } from "../models/user";

vi.mock("../hooks/auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

function createMockUser(overrides?: Partial<User>) {
  return new User({
    id: "1",
    email: "test@test.com",
    firstName: "Test",
    lastName: "User",
    role: UserRole.CLIENT,
    isActive: true,
    ...overrides,
  });
}

describe("ProtectedRoute", () => {
  it("redirige al home si no hay usuario", () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      credentialLogin: vi.fn(),
      faceLogin: vi.fn(),
      register: vi.fn(),
      reloadSession: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
            <Route path="/protected" element={<div>Protected Page</div>} />
          </Route>
          <Route path="/" element={<div>Home</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("redirige al dashboard si el usuario no tiene rol permitido", () => {
    const user = createMockUser({ role: UserRole.CLIENT });

    mockedUseAuth.mockReturnValue({
      user,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      credentialLogin: vi.fn(),
      faceLogin: vi.fn(),
      register: vi.fn(),
      reloadSession: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
            <Route path="/protected" element={<div>Protected Page</div>} />
          </Route>
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renderiza el contenido si el usuario tiene rol permitido", () => {
    const user = createMockUser({ role: UserRole.ADMIN });

    mockedUseAuth.mockReturnValue({
      user,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      credentialLogin: vi.fn(),
      faceLogin: vi.fn(),
      register: vi.fn(),
      reloadSession: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
            <Route path="/protected" element={<div>Protected Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Protected Page")).toBeInTheDocument();
  });
});
