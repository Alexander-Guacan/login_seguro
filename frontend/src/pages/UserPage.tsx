import { useParams } from "react-router";
import { useUser } from "../hooks/user/useUser";
import { ErrorMessage, Field, Form, Formik, type FormikHelpers } from "formik";
import { getRoleName, UserRole } from "../enums/userRole.enum";
import { useMemo, useState } from "react";
import * as yup from "yup";
import { User } from "../models/user";
import { PageHeader } from "../components/PageSection/PageHeader";
import { SubmitButton } from "../components/Form/SubmitButton";
import { PasswordInput } from "../components/Form/PasswordInput";

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  password: string;
  passwordVerification: string;
};

const validationSchema = yup.object({
  firstName: yup
    .string()
    .min(3, "Nombre muy corto")
    .max(50, "Nombre muy largo")
    .required("Este campo es obligatorio"),
  lastName: yup
    .string()
    .min(3, "Apellido muy corto")
    .max(50, "Apellido muy largo")
    .required("Este campo es obligatorio"),
  email: yup.string().email("Ingrese un email válido"),
  password: yup
    .string()
    .min(8, "La contraseña es muy corta")
    .max(50, "La contraseña es muy larga")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      {
        message:
          "Debe contener mayúscula, minúscula, número y carácter especial.",
      },
    ),
  passwordVerification: yup
    .string()
    .equals([yup.ref("password")], "Las contraseñas no coinciden"),
});

export function UserPage() {
  const params = useParams();
  const { userId } = params;
  const { user, update } = useUser({ id: userId });
  const [formError, setFormError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const initialValues = useMemo<FormValues>(() => {
    return {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      role: user?.role ?? UserRole.CLIENT,
      isActive: user?.isActive ?? true,
      password: "",
      passwordVerification: "",
    };
  }, [user]);

  const handleSubmit = async (
    values: FormValues,
    { setSubmitting, resetForm }: FormikHelpers<FormValues>,
  ) => {
    setFormError(null);

    if (!user) {
      setSubmitting(false);
      return;
    }

    const updatedInfo = new User({
      id: user.id,
      email: values.email,
      firstName: values.firstName,
      lastName: values.lastName,
      role: values.role,
      isActive: values.isActive,
      createdAt: user.createdAt,
      preferences: user.preferences,
    });

    const result = await update(user.id, updatedInfo, values.password);

    if (!result.success) {
      setFormError(result.error);
      resetForm();
    } else {
      setFormMessage(result.message);
      setTimeout(() => {
        setFormMessage(null);
      }, 3500);
    }

    setSubmitting(false);
  };

  if (!userId || !user) return null;

  return (
    <main className="flex flex-col gap-6 h-full">
      <PageHeader
        title="Perfil de usuario"
        breadcrumbsLabels={["Dashboard", "Usuarios", user.fullName]}
      />
      <section className="form-container form-container--multicolumn mx-auto w-[70%]">
        <header>
          <h3 className="form-container__title">Administrar usuario</h3>
        </header>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ dirty, isSubmitting, values, handleChange, handleBlur }) => (
            <Form>
              <div className="field-group">
                <label htmlFor="firstName">Nombre</label>
                <Field type="text" id="firstName" name="firstName" required />
                <ErrorMessage
                  className="alert alert--error text-xs"
                  component="p"
                  name="firstName"
                />
              </div>
              <div className="field-group">
                <label htmlFor="lastName">Apellido</label>
                <Field type="text" id="lastName" name="lastName" required />
                <ErrorMessage
                  className="alert alert--error text-xs"
                  component="p"
                  name="lastName"
                />
              </div>
              <div className="field-group">
                <label htmlFor="email">Correo electrónico</label>
                <Field type="email" id="email" name="email" required />
                <ErrorMessage
                  className="alert alert--error text-xs"
                  component="p"
                  name="email"
                />
              </div>
              <div className="field-group">
                <label htmlFor="role">Rol</label>
                <Field as="select" id="role" name="role">
                  <option value={UserRole.ADMIN}>
                    {getRoleName(UserRole.ADMIN)}
                  </option>
                  <option value={UserRole.CLIENT}>
                    {getRoleName(UserRole.CLIENT)}
                  </option>
                </Field>
                <ErrorMessage
                  className="alert alert--error text-xs"
                  component="p"
                  name="role"
                />
              </div>
              <div className="field-group">
                <label htmlFor="password">Contraseña</label>
                <PasswordInput
                  id="password"
                  name="password"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <ErrorMessage
                  className="alert alert--error text-xs"
                  component="p"
                  name="password"
                />
              </div>
              <div className="field-group">
                <label htmlFor="passwordVerification">Repetir contraseña</label>
                <PasswordInput
                  id="passwordVerification"
                  name="passwordVerification"
                  value={values.passwordVerification}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <ErrorMessage
                  className="alert alert--error text-xs"
                  component="p"
                  name="passwordVerification"
                />
              </div>
              <div className="field-group flex-row gap-x-2 items-center">
                <label htmlFor="isActive">Activo</label>
                <Field type="checkbox" id="isActive" name="isActive" />
              </div>
              <div className="flex flex-col gap-y-4">
                <SubmitButton disabled={!dirty} loading={isSubmitting}>
                  Actualizar
                </SubmitButton>
                {formError && (
                  <p className="alert alert--error text-xs">{formError}</p>
                )}
                {formMessage && (
                  <p className="alert alert--success">{formMessage}</p>
                )}
              </div>
            </Form>
          )}
        </Formik>
      </section>
    </main>
  );
}
