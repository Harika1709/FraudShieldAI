import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    classification_report,
    roc_auc_score,
    roc_curve
)

from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE

# =========================
# LOAD DATASET
# =========================

df = pd.read_csv("creditcard.csv")

print("\nDataset Shape:")
print(df.shape)

print("\nFirst 5 Rows:")
print(df.head())

# =========================
# CHECK MISSING VALUES
# =========================

print("\nMissing Values:")
print(df.isnull().sum())

# =========================
# CLASS DISTRIBUTION
# =========================

print("\nClass Distribution:")
print(df['Class'].value_counts())

# =========================
# VISUALIZATION
# =========================

plt.figure(figsize=(6,4))
sns.countplot(x='Class', data=df)
plt.title("Fraud vs Genuine Transactions")
plt.xlabel("Class")
plt.ylabel("Count")
plt.show()

# =========================
# FEATURE SCALING
# =========================

scaler = StandardScaler()

df['scaled_amount'] = scaler.fit_transform(df['Amount'].values.reshape(-1,1))
df['scaled_time'] = scaler.fit_transform(df['Time'].values.reshape(-1,1))

df.drop(['Time','Amount'], axis=1, inplace=True)

# =========================
# FEATURES & TARGET
# =========================

X = df.drop('Class', axis=1)
y = df['Class']

# =========================
# TRAIN TEST SPLIT
# =========================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# =========================
# HANDLE IMBALANCED DATA
# =========================

print("\nApplying SMOTE...")

smote = SMOTE(random_state=42)

X_train_smote, y_train_smote = smote.fit_resample(X_train, y_train)

print("Before SMOTE:", y_train.value_counts())
print("After SMOTE:", y_train_smote.value_counts())

# =========================
# LOGISTIC REGRESSION
# =========================

print("\nTraining Logistic Regression...")

lr = LogisticRegression(max_iter=1000)

lr.fit(X_train_smote, y_train_smote)

lr_pred = lr.predict(X_test)

print("\nLogistic Regression Accuracy:")
print(accuracy_score(y_test, lr_pred))

# =========================
# RANDOM FOREST
# =========================

print("\nTraining Random Forest...")

rf = RandomForestClassifier(n_estimators=100)

rf.fit(X_train_smote, y_train_smote)

rf_pred = rf.predict(X_test)

print("\nRandom Forest Accuracy:")
print(accuracy_score(y_test, rf_pred))

# =========================
# XGBOOST
# =========================

print("\nTraining XGBoost...")

xgb = XGBClassifier(
    n_estimators=100,
    max_depth=6,
    learning_rate=0.1,
    eval_metric='logloss'
)

xgb.fit(X_train_smote, y_train_smote)

xgb_pred = xgb.predict(X_test)

# =========================
# MODEL EVALUATION
# =========================

print("\nXGBoost Accuracy:")
print(accuracy_score(y_test, xgb_pred))

print("\nClassification Report:")
print(classification_report(y_test, xgb_pred))

# =========================
# CONFUSION MATRIX
# =========================

cm = confusion_matrix(y_test, xgb_pred)

plt.figure(figsize=(6,4))
sns.heatmap(cm, annot=True, fmt='d')
plt.title("Confusion Matrix")
plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.show()

# =========================
# ROC AUC SCORE
# =========================

roc_score = roc_auc_score(y_test, xgb_pred)

print("\nROC-AUC Score:")
print(roc_score)

# =========================
# ROC CURVE
# =========================

y_prob = xgb.predict_proba(X_test)[:,1]

fpr, tpr, thresholds = roc_curve(y_test, y_prob)

plt.figure(figsize=(6,4))
plt.plot(fpr, tpr)
plt.xlabel("False Positive Rate")
plt.ylabel("True Positive Rate")
plt.title("ROC Curve")
plt.show()

# =========================
# CORRELATION HEATMAP
# =========================

plt.figure(figsize=(18,10))
sns.heatmap(df.corr(), cmap='coolwarm')
plt.title("Correlation Heatmap")
plt.show()

# =========================
# SAVE MODEL
# =========================

joblib.dump(xgb, "fraud_model.pkl")

print("\nModel saved successfully as fraud_model.pkl")

# =========================
# SAMPLE PREDICTION
# =========================

sample = X_test.iloc[0].values.reshape(1, -1)

prediction = xgb.predict(sample)

if prediction[0] == 1:
    print("\nPrediction: Fraudulent Transaction")
else:
    print("\nPrediction: Genuine Transaction")

from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

y_pred = xgb.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)

print(f"Accuracy: {accuracy * 100:.2f}%")

print("\nClassification Report:")
print(classification_report(y_test, y_pred))

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))
