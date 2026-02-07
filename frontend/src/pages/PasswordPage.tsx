import {
  ErrorMessage,
  Form,
  Formik,
  type FormikProps,
  type FormikHelpers,
} from "formik";
import { usePassword } from "../hooks/user/usePassword";
import { useRef, useState } from "react";
import * as yup from "yup";
import { ConfirmDialog } from "../components/Dialog/ConfirmDialog";
import { PageHeader } from "../components/PageSection/PageHeader";
import { PasswordInput } from "../components/Form/PasswordInput";
import { SubmitButton } from "../components/Form/SubmitButton";

const initialValues = {
  oldPassword: "",
  newPassword: "",
  passwordVerification: "",
};

type FormValues = typeof initialValues;

const validationSchema = yup.object({
  oldPassword: yup.string().required("Este campo es obligatorio"),
  newPassword: yup
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
    .equals([yup.ref("newPassword")], "Las contraseñas no coinciden")
    .required("Este campo es obligatorio"),
});

export function PasswordPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const { changePassword } = usePassword();
  const formRef = useRef<FormikProps<FormValues>>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSubmit = async (
    values: FormValues,
    { setSubmitting, resetForm }: FormikHelpers<FormValues>,
  ) => {
    setFormError(null);

    const result = await changePassword({
      currentPassword: values.oldPassword,
      newPassword: values.newPassword,
    });

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

  const openModal = () => setModalOpen(true);

  const closeModal = () => setModalOpen(false);

  const validateSubmit = async () => {
    if (!formRef.current) return;

    const errors = await formRef.current.validateForm();
    const hasErrors = errors && Object.values(errors).some((e) => e != null);

    if (hasErrors) return await formRef.current?.submitForm();

    openModal();
  };

  const submitForm = async () => {
    closeModal();

    if (!formRef.current) return;

    await formRef.current.submitForm();
  };

  const cancelSubmit = () => {
    if (!formRef.current) return;

    formRef.current.resetForm();
    closeModal();
  };

  return (
    <main className="flex flex-col gap-6 h-full">
      <PageHeader
        title="Contraseña"
        breadcrumbsLabels={["Dashboard", "Contraseña"]}
      />
      <section className="form-container w-[50%] mx-auto">
        <header>
          <h3>Cambiar Contraseña</h3>
        </header>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          innerRef={formRef}
        >
          {({ isSubmitting, values, handleChange, handleBlur }) => (
            <Form noValidate>
              <div className="field-group">
                <label htmlFor="oldPassword">Contraseña actual</label>
                <PasswordInput
                  id="oldPassword"
                  name="oldPassword"
                  value={values.oldPassword}
                  required
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <ErrorMessage
                  className="alert alert--danger text-xs"
                  component="p"
                  name="oldPassword"
                />
              </div>
              <div className="field-group">
                <label htmlFor="newPassword">Nueva contraseña</label>
                <PasswordInput
                  id="newPassword"
                  name="newPassword"
                  value={values.newPassword}
                  required
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <ErrorMessage
                  className="alert alert--danger text-xs"
                  component="p"
                  name="newPassword"
                />
              </div>
              <div className="field-group">
                <label htmlFor="passwordVerification">Repetir contraseña</label>
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
                <SubmitButton loading={isSubmitting} onClick={validateSubmit}>
                  Cambiar contraseña
                </SubmitButton>
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

      <ConfirmDialog
        open={modalOpen}
        title={"Cambiar contraseña"}
        question={"¿Está seguro que desea cambiar su contraseña?"}
        onAccept={submitForm}
        onDecline={cancelSubmit}
      />
    </main>
  );
}
