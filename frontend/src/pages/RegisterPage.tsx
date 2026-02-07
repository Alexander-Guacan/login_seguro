import { ErrorMessage, Field, Form, Formik, type FormikHelpers } from "formik";
import { useState } from "react";
import * as yup from "yup";
import { useAuth } from "../hooks/auth/useAuth";
import { PasswordInput } from "../components/Form/PasswordInput";
import { SubmitButton } from "../components/Form/SubmitButton";
import { Link } from "react-router";

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordVerification: string;
}

const initialValues: FormValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  passwordVerification: "",
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
  email: yup
    .string()
    .email("Ingrese un email válido")
    .required("Este campo es obligatorio"),
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
    )
    .required("Este campo es obligatorio"),
  passwordVerification: yup
    .string()
    .equals([yup.ref("password")], "Las contraseñas no coinciden")
    .required("Este campo es obligatorio"),
});

export function RegisterPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const { register } = useAuth();

  const handleSubmit = async (
    values: FormValues,
    { setSubmitting, resetForm }: FormikHelpers<FormValues>,
  ) => {
    const result = await register({
      email: values.email,
      firstName: values.firstName,
      lastName: values.lastName,
      password: values.password,
    });

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
    <main className="content-center text-center w-full h-full">
      <section className="form-container form-container--multicolumn mx-auto max-w-150">
        <header>
          <h1 className="form-container__title">Registro de usuario</h1>
        </header>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, values, handleChange, handleBlur }) => (
            <Form>
              <div className="field-group">
                <label htmlFor="firstName">Nombre</label>
                <Field
                  type="text"
                  id="firstName"
                  name="firstName"
                  placeholder="John"
                  required
                />
                <ErrorMessage
                  className="alert alert--danger text-xs"
                  component="p"
                  name="firstName"
                />
              </div>
              <div className="field-group">
                <label htmlFor="lastName">Apellido</label>
                <Field
                  type="text"
                  id="lastName"
                  name="lastName"
                  placeholder="Doe"
                  required
                />
                <ErrorMessage
                  className="alert alert--danger text-xs"
                  component="p"
                  name="lastName"
                />
              </div>
              <div className="field-group">
                <label htmlFor="email">Correo electrónico</label>
                <Field
                  type="email"
                  id="email"
                  name="email"
                  placeholder="johndoe@secure-login.com"
                  required
                />
                <ErrorMessage
                  className="alert alert--danger text-xs"
                  component="p"
                  name="email"
                />
              </div>
              <div className="field-group">
                <label htmlFor="password">Contraseña</label>
                <PasswordInput
                  id="password"
                  name="password"
                  value={values.password}
                  required
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <ErrorMessage
                  className="alert alert--danger text-xs"
                  component="p"
                  name="password"
                />
              </div>
              <div className="field-group">
                <label htmlFor="passwordVerification">
                  Verificar contraseña
                </label>
                <PasswordInput
                  id="passwordVerification"
                  name="passwordVerification"
                  value={values.passwordVerification}
                  required
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <ErrorMessage
                  className="alert alert--danger text-xs"
                  component="p"
                  name="passwordVerification"
                />
              </div>
              <div className="flex flex-col gap-y-4">
                <SubmitButton loading={isSubmitting}>Registrarse</SubmitButton>
                {formError && (
                  <p className="alert alert--danger text-xs">{formError}</p>
                )}
                {formMessage && (
                  <p className="alert alert--success">{formMessage}</p>
                )}
              </div>
            </Form>
          )}
        </Formik>
      </section>
      <article className="py-6">
        <p>
          ¿Ya tienes una cuenta?{" "}
          <Link className="link" to={"/login"}>
            Inicia Sesión
          </Link>
        </p>
      </article>
    </main>
  );
}
