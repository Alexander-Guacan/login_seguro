import { Fragment, useMemo } from "react";
import { useAuth } from "../../hooks/auth/useAuth";
import { Link, useLocation } from "react-router";

interface Props {
  title?: string;
}

interface BreadCrumb {
  text: string;
  url: string;
}

export function PageHeader({ title }: Props) {
  const { pathname } = useLocation();
  const { user } = useAuth();

  const titleMessage = title ?? `Bienvenido de vuelta! ${user?.fullName} 👋`;

  const breadcrumbs = useMemo<BreadCrumb[]>(() => {
    const pathSegments = pathname.split("/");
    return pathSegments.map((text, index, array) => ({
      text: index === 0 ? "🏠" : text,
      url: index === 0 ? "/dashboard" : array.slice(0, index + 1).join("/"),
    }));
  }, [pathname]);

  return (
    <section className="px-6 py-4 rounded-md bg-sky-800 flex flex-col gap-y-3">
      <h1 className="font-bold text-xl">{titleMessage}</h1>
      <nav>
        <ul className="flex gap-x-2 text-sm font-semibold">
          {breadcrumbs.map(({ text, url }, index) => {
            const lastItem = index === breadcrumbs.length - 1;

            const breadcrumElement = (
              <li>
                <Link to={url}>{text}</Link>
              </li>
            );

            return (
              <Fragment key={index}>
                {breadcrumElement}
                {!lastItem && <li>&gt;</li>}
              </Fragment>
            );
          })}
        </ul>
      </nav>
    </section>
  );
}
