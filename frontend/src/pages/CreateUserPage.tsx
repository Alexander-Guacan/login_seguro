import { ErrorMessage, Field, Form, Formik, type FormikHelpers } from "formik";
import { PageHeader } from "../components/PageSection/PageHeader";
import { getRoleName, UserRole } from "../enums/userRole.enum";
import * as yup from "yup";
import { useState } from "react";
import { useUser } from "../hooks/user/useUser";
import { User } from "../models/user";

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  password: string;
  passwordVerification: string;
}

const initialValues: FormValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  passwordVerification: "",
  role: UserRole.CLIENT,
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

export function CreateUserPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const { create } = useUser();

  const handleSubmit = async (
    values: FormValues,
    { setSubmitting, resetForm }: FormikHelpers<FormValues>,
  ) => {
    const { email, firstName, lastName, password, role } = values;

    const user = new User({
      email: email.trim(),
      firstName: firstName.trim().toLocaleLowerCase(),
      lastName: lastName.trim().toLocaleLowerCase(),
      isActive: true,
      role,
    });

    const result = await create(user, password);

    if (!result.success) {
      setFormError(result.error);
    } else {
      setFormMessage(result.message);
      resetForm();

      setTimeout(() => {
        setFormMessage(null);
      }, 3500);
    }

    setSubmitting(false);
  };

  return (
    <main className="flex flex-col gap-y-6">
      <PageHeader title="Crear usuario" />
      <section className="form-container form-container--multicolumn">
        <header>
          <h2 className="form-container__title">Usuario</h2>
        </header>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form>
              <div className="field-group">
                <label htmlFor="firstName">Nombre</label>
                <Field type="text" id="firstName" name="firstName" required />
                <ErrorMessage
                  className="input-message input-message--error"
                  component="p"
                  name="firstName"
                />
              </div>
              <div className="field-group">
                <label htmlFor="lastName">Apellido</label>
                <Field type="text" id="lastName" name="lastName" required />
                <ErrorMessage
                  className="input-message input-message--error"
                  component="p"
                  name="lastName"
                />
              </div>
              <div className="field-group">
                <label htmlFor="email">Correo electrónico</label>
                <Field type="email" id="email" name="email" required />
                <ErrorMessage
                  className="input-message input-message--error"
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
                  className="input-message input-message--error"
                  component="p"
                  name="role"
                />
              </div>
              <div className="field-group">
                <label htmlFor="password">Contraseña</label>
                <Field type="password" id="password" name="password" />
                <ErrorMessage
                  className="input-message input-message--error"
                  component="p"
                  name="password"
                />
              </div>
              <div className="field-group">
                <label htmlFor="passwordVerification">Repetir contraseña</label>
                <Field
                  type="password"
                  id="passwordVerification"
                  name="passwordVerification"
                />
                <ErrorMessage
                  className="input-message input-message--error"
                  component="p"
                  name="passwordVerification"
                />
              </div>
              <div className="flex flex-col gap-y-4">
                <button
                  className="button"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Actualizando..." : "Actualizar"}
                </button>
                {formError && <p className="alert alert--error">{formError}</p>}
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
