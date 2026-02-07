import { Fragment, useMemo } from "react";
import { Link, useLocation } from "react-router";
import { TbPointFilled } from "react-icons/tb";

interface Props {
  title: string;
  breadcrumbsLabels?: string[];
}

interface BreadCrumb {
  text: string;
  url: string;
}

export function PageHeader({ title, breadcrumbsLabels }: Props) {
  const { pathname } = useLocation();

  const breadcrumbs = useMemo<BreadCrumb[]>(() => {
    const HOME_ROUTE = "dashboard";
    const segments = pathname
      .split("/")
      .filter((segment) => segment !== HOME_ROUTE);

    return segments.map((text, index, array) => ({
      text: breadcrumbsLabels?.at(index) ?? text,
      url: index === 0 ? "/dashboard" : array.slice(0, index + 1).join("/"),
    }));
  }, [pathname, breadcrumbsLabels]);

  return (
    <section className="px-6 py-4 rounded-md bg-indigo-500/10 flex flex-col gap-y-3">
      <h1 className="font-bold text-xl">{title}</h1>
      <nav>
        <ul className="flex gap-x-2 text-sm items-center">
          {breadcrumbs.map(({ text, url }, index) => {
            const lastItem = index === breadcrumbs.length - 1;

            const breadcrumElement = (
              <li>
                <Link className={!lastItem ? "text-gray-800/80" : ""} to={url}>
                  {text}
                </Link>
              </li>
            );

            return (
              <Fragment key={index}>
                {breadcrumElement}
                {!lastItem && (
                  <li>
                    <TbPointFilled />
                  </li>
                )}
              </Fragment>
            );
          })}
        </ul>
      </nav>
    </section>
  );
}
