[
  {
    $lookup: {
      from: "six_shapes",
      let: {
        gov_inn: "$inn",
        gov_soato7_number: {
          $toLong: "$soato7"
        }
      },
      pipeline: [
        {
          $addFields: {
            org_inn_str: {
              $toString: "$organization_inn"
            }
          }
        },
        {
          $match: {
            $expr: {
              $and: [
                {
                  $eq: [
                    "$soato",
                    "$$gov_soato7_number"
                  ]
                },
                {
                  $eq: [
                    "$org_inn_str",
                    "$$gov_inn"
                  ]
                }
              ]
            }
          }
        },
        {
          $project: {
            six_shape: 1,
            total_land_area: 1,
            _id: 0
          }
        }
      ],
      as: "matched_six_shapes"
    }
  },
  {
    $unwind: {
      path: "$matched_six_shapes",
      preserveNullAndEmptyArrays: false
    }
  },
  {
    $addFields: {
      six_shape: "$matched_six_shapes.six_shape",
      total_land_area:
        "$matched_six_shapes.total_land_area"
    }
  },
  {
    $project: {
      matched_six_shapes: 0
    }
  }
]




[
  {
    $lookup: {
      from: "six_shapes",
      let: {
        gov_inn: "$inn",
        gov_soato7: {
          $toLong: "$soato7"
        }
      },
      pipeline: [
        {
          $addFields: {
            six_shape_inn: {
              $toString: "$organization_inn"
            },
            six_shape_soato: {
              $toLong: "$soato"
            }
          }
        },
        {
          $match: {
            $expr: {
              $and: [
                {
                  $eq: [
                    "$six_shape_inn",
                    "$$gov_inn"
                  ]
                },
                {
                  $eq: [
                    "$six_shape_soato",
                    "$$gov_soato7"
                  ]
                }
              ]
            }
          }
        },
        {
          $project: {
            six_shape: 1,
            total_land_area: 1,
            _id: 0
          }
        }
      ],
      as: "six_shape_info"
    }
  }
]





[
  {
    $addFields: {
      organization_inn_str: {
        $toString: "$organization_inn"
      }
    }
  },
  {
    $lookup: {
      from: "agri_land_full",
      let: {
        inn: "$organization_inn_str"
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ["$tin", "$$inn"]
            }
          }
        }
      ],
      as: "matched_agri_land_full"
    }
  },
  {
    $match: {
      "matched_agri_land_full.0": {
        $exists: true
      }
    }
  },
  {
    $project: {
      organization_inn_str: 0,
      matched_agri_land_full: {
        _id: 0,
        id: 0,
        old_id: 0,
        cadastral_number_old: 0,
        viloyat_name: 0,
        mahalla_name: 0,
        tuman_name: 0,
        geom: 0,
        geom_g: 0,
        tin: 0,
        owner_full_name: 0,
        tin_total_gis_area_ha: 0,
        updated_at: 0,
        compare_cadastral_and_report_shape_diff: 0,
        compare_cadastral_and_report_shape: 0,
        geom_g_s: 0,
        is_tin_14: 0,
        submitted_five_shape: 0,
        survey_match: 0,
        five_shape_crop_area: 0,
        five_shape_planted_area: 0,
        five_shape_total_land_area: 0,
        compare_submission: 0,
        compare_submission_diff: 0,
        geom_g_s_number: 0
      }
    }
  }
]





[
  {
    $addFields: {
      organization_inn_str: {
        $toString: "$organization_inn"
      }
    }
  },
  {
    $lookup: {
      from: "agri_land_full",
      let: {
        inn: "$organization_inn_str"
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ["$tin", "$$inn"]
            }
          }
        }
      ],
      as: "matched_agri_land_full"
    }
  },
  {
    $match: {
      "matched_agri_land_full.0": {
        $exists: true
      }
    }
  },
  {
    $project: {
      organization_inn_str: 0,
      okpo: 0,
      old_soato: 0,
      status: 0,
      section: 0,
      mahalla_inn: 0,
      land_fund_category: 0,
      land_fund_category_description: 0,
      land_fund_type: 0,
      land_fund_type_description: 0,
      source_file: 0,
      matched_agri_land_full: {
        _id: 0,
        id: 0,
        old_id: 0,
        cadastral_number_old: 0,
        viloyat_name: 0,
        mahalla_name: 0,
        tuman_name: 0,
        geom: 0,
        geom_g: 0,
        tin: 0,
        owner_full_name: 0,
        tin_total_gis_area_ha: 0,
        updated_at: 0,
        compare_cadastral_and_report_shape_diff: 0,
        compare_cadastral_and_report_shape: 0,
        geom_g_s: 0,
        is_tin_14: 0,
        submitted_five_shape: 0,
        survey_match: 0,
        five_shape_crop_area: 0,
        five_shape_planted_area: 0,
        five_shape_total_land_area: 0,
        compare_submission: 0,
        compare_submission_diff: 0,
        geom_g_s_number: 0
      }
    }
  }
]



[
  {
    $addFields: {
      organization_inn_str: {
        $toString: "$organization_inn"
      }
    }
  },
  {
    $lookup: {
      from: "agri_land_full",
      let: {
        inn: "$organization_inn_str"
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ["$tin", "$$inn"]
            }
          }
        }
      ],
      as: "matched_agri_land_full"
    }
  },
  {
    $match: {
      "matched_agri_land_full.0": {
        $exists: true
      }
    }
  },
  {
    $project: {
      organization_inn_str: 0,
      okpo: 0,
      old_soato: 0,
      status: 0,
      section: 0,
      mahalla_inn: 0,
      land_fund_category: 0,
      land_fund_category_description: 0,
      land_fund_type: 0,
      land_fund_type_description: 0,
      source_file: 0,
      matched_agri_land_full: {
        _id: 0,
        id: 0,
        old_id: 0,
        cadastral_number_old: 0,
        viloyat_name: 0,
        mahalla_name: 0,
        tuman_name: 0,
        geom: 0,
        geom_g: 0,
        tin: 0,
        owner_full_name: 0,
        tin_total_gis_area_ha: 0,
        updated_at: 0,
        compare_cadastral_and_report_shape_diff: 0,
        compare_cadastral_and_report_shape: 0,
        geom_g_s: 0,
        is_tin_14: 0,
        submitted_five_shape: 0,
        survey_match: 0,
        five_shape_crop_area: 0,
        five_shape_planted_area: 0,
        five_shape_total_land_area: 0,
        compare_submission: 0,
        compare_submission_diff: 0,
        geom_g_s_number: 0
      }
    }
  },
  {
    $addFields: {
      cadastr_total: {
        $sum: {
          $map: {
            input: "$matched_agri_land_full",
            as: "item",
            in: {
              $convert: {
                input: "$$item.gis_area_ha",
                to: "double",
                onError: 0,
                onNull: 0
              }
            }
          }
        }
      }
    }
  }
]


// sungisi 

[
  {
    $addFields: {
      organization_inn_str: {
        $toString: "$organization_inn"
      }
    }
  },
  {
    $lookup: {
      from: "agri_land_full",
      let: {
        inn: "$organization_inn_str"
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ["$tin", "$$inn"]
            }
          }
        }
      ],
      as: "matched_agri_land_full"
    }
  },
  {
    $match: {
      "matched_agri_land_full.0": {
        $exists: true
      }
    }
  },
  {
    $project: {
      organization_inn_str: 0,
      okpo: 0,
      old_soato: 0,
      status: 0,
      section: 0,
      mahalla_inn: 0,
      land_fund_category: 0,
      land_fund_category_description: 0,
      land_fund_type: 0,
      land_fund_type_description: 0,
      source_file: 0,
      matched_agri_land_full: {
        _id: 0,
        id: 0,
        old_id: 0,
        cadastral_number_old: 0,
        viloyat_name: 0,
        mahalla_name: 0,
        tuman_name: 0,
        geom: 0,
        geom_g: 0,
        tin: 0,
        owner_full_name: 0,
        tin_total_gis_area_ha: 0,
        updated_at: 0,
        compare_cadastral_and_report_shape_diff: 0,
        compare_cadastral_and_report_shape: 0,
        geom_g_s: 0,
        is_tin_14: 0,
        submitted_five_shape: 0,
        survey_match: 0,
        five_shape_crop_area: 0,
        five_shape_planted_area: 0,
        five_shape_total_land_area: 0,
        compare_submission: 0,
        compare_submission_diff: 0,
        geom_g_s_number: 0
      }
    }
  },
  {
    $addFields: {
      cadastr_total: {
        $sum: {
          $map: {
            input: "$matched_agri_land_full",
            as: "item",
            in: {
              $convert: {
                input: "$$item.gis_area_ha",
                to: "double",
                onError: 0,
                onNull: 0
              }
            }
          }
        }
      }
    }
  },
  {
    $addFields: {
      matched_agri_land_full: {
        $map: {
          input: "$matched_agri_land_full",
          as: "item",
          in: {
            $mergeObjects: [
              "$$item",
              {
                ulush: {
                  $cond: [
                    {
                      $and: [
                        {
                          $gt: [
                            "$cadastr_total",
                            0
                          ]
                        },
                        {
                          $gt: [
                            "$total_land_area",
                            0
                          ]
                        }
                      ]
                    },
                    {
                      $multiply: [
                        {
                          $divide: [
                            {
                              $convert: {
                                input:
                                  "$$item.gis_area_ha",
                                to: "double",
                                onError: 0,
                                onNull: 0
                              }
                            },
                            "$cadastr_total"
                          ]
                        },
                        1,
                        "$total_land_area"
                      ]
                    },
                    0
                  ]
                }
              }
            ]
          }
        }
      }
    }
  }
]