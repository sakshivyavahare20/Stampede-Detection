# 🚶‍♂️ Crowd Detection and Tracking in Dense Scenes

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![YOLOv8](https://img.shields.io/badge/YOLOv8-Detection-orange.svg)
![DeepSORT](https://img.shields.io/badge/DeepSORT-Tracking-green.svg)
![License](https://img.shields.io/badge/License-MIT-lightgrey.svg)

---

## 🧠 Overview

This project provides an **end-to-end pipeline** for automatic **human detection**, **multi-object tracking**, **crowd-density analysis**, and **stampede risk prediction** in dense public environments using state-of-the-art deep learning models.

---

## ✨ Features

✅ **Person Detection:** YOLOv8 (pretrained/custom-trained)
✅ **Multi-Object Tracking:** DeepSORT with appearance embeddings
✅ **Crowd Density Heatmap:** Spatial zoning-based density analysis
✅ **Trajectory Visualization:** Track movement direction and velocity
✅ **Risk Scoring:** Stampede or crowd surge detection using dynamic features

---

## 📚 Supported Datasets

| Dataset                                                            | Description                                                               |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| [**CrowdHuman**](https://www.crowdhuman.org)                       | Large-scale crowded human detection dataset with body & head annotations. |
| [**JHU-CROWD++**](https://www.crowdcounting.org/jhu-crowd-dataset) | Diverse dataset for crowd counting and occlusion scenarios.               |
| [**MOT20 (MOTChallenge)**](https://motchallenge.net/)              | Benchmark dataset for multi-object tracking in dense pedestrian scenes.   |

---

## ⚙️ Quick Start

### 1️⃣ Clone Repository & Install Dependencies

```bash
git clone https://github.com/yourusername/Crowd-Detection-Tracking.git
cd Crowd-Detection-Tracking
pip install -r requirements.txt
```

**Or install manually:**

```bash
pip install ultralytics deep-sort-realtime opencv-python numpy matplotlib
```

---

### 2️⃣ Prepare Dataset

Download your preferred dataset (**CrowdHuman**, **JHU-CROWD++**, or **MOT20**) and organize your data as:

```
data/
├── images/
└── videos/
```

---

### 3️⃣ Train or Use Pretrained Model

Use YOLOv8 pretrained weights (`yolov8n.pt`) or fine-tune your own model:

```bash
yolo train model=yolov8n.pt data=crowdhuman.yaml epochs=50 imgsz=640
```

---

### 4️⃣ Run Detection & Tracking

Upload your video or image in Colab or your local setup:

```bash
python detect_track.py --source path/to/video.mp4 --weights models/best.pt
```

The system will:

* Detect people in each frame
* Assign unique IDs using DeepSORT
* Display bounding boxes, IDs, and trajectories

---

### 5️⃣ Perform Crowd Risk Analysis

Run the analysis notebook:

```bash
notebooks/spatial_zoning_analysis.ipynb
```

This will:

* Generate **heatmaps** for crowd density
* Compute **zone-wise counts and velocities**
* Predict **risk scores** for potential stampede zones

---

## 🧩 Citation

If you use this pipeline, please cite the original **CrowdHuman** paper:

```bibtex
@article{shao2018crowdhuman,
  title={CrowdHuman: A Benchmark for Detecting Human in a Crowd},
  author={Shao, Shuai and Zhao, Zijian and Li, Boxun and Xiao, Tete and Yu, Gang and Zhang, Xiangyu and Sun, Jian},
  journal={arXiv preprint arXiv:1805.00123},
  year={2018}
}
```

---

## 📜 License

This project follows the **MIT License**.
See dataset and YOLOv8 licenses for dataset-specific terms.

---

## 🔗 Useful Resources

* [CrowdHuman Dataset](https://www.crowdhuman.org/download.html)
* [CrowdHuman on HuggingFace](https://huggingface.co/datasets/sshao0516/CrowdHuman/tree/main)
* [MOTChallenge Benchmark](https://motchallenge.net/data/MOT20/)
* [JHU-CROWD++ Dataset](https://www.crowdcounting.org/jhu-crowd-dataset)

---

### 🎯 *Ready to Detect, Track, and Analyze Crowds!*

```bash
python detect_track.py --source data/videos/test.mp4
```

---

